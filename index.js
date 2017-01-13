import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';


const PAGE_CHANGE_DELAY = 4000;

/**
 * Animates pages in cycle
 * (loop possible if children count > 1)
*/
export default class Carousel extends Component {
  static propTypes = {
    children: React.PropTypes.node.isRequired,
    autoplay: React.PropTypes.bool,
    delay: React.PropTypes.number,
    infinite: React.PropTypes.bool,
    currentPage: React.PropTypes.number,
    style: View.propTypes.style,
    pageStyle: View.propTypes.style,
    contentContainerStyle: View.propTypes.style,
    pageInfo: React.PropTypes.bool,
    pageInfoBackgroundColor: React.PropTypes.string,
    pageInfoTextStyle: Text.propTypes.style,
    pageInfoTextSeparator: React.PropTypes.string,
    bullets: React.PropTypes.bool,
    bulletsContainerStyle: Text.propTypes.style,
    bulletStyle: Text.propTypes.style,
    arrows: React.PropTypes.bool,
    arrowsContainerStyle: Text.propTypes.style,
    arrowstyle: Text.propTypes.style,
    leftArrowText: React.PropTypes.string,
    rightArrowText: React.PropTypes.string,
    chosenBulletStyle: Text.propTypes.style,
    onAnimateNextPage: React.PropTypes.func,
    scrollWidth: React.PropTypes.number,
    touchDisablesAutoplay: React.PropTypes.bool,
  };

  static defaultProps = {
    delay: PAGE_CHANGE_DELAY,
    infinite: true,
    autoplay: true,
    pageInfo: false,
    bullets: false,
    arrows: false,
    pageInfoBackgroundColor: 'rgba(0, 0, 0, 0.25)',
    pageInfoTextSeparator: ' / ',
    currentPage: 0,
    style: undefined,
    pageStyle: undefined,
    contentContainerStyle: undefined,
    pageInfoTextStyle: undefined,
    bulletsContainerStyle: undefined,
    chosenBulletStyle: undefined,
    bulletStyle: undefined,
    arrowsContainerStyle: undefined,
    arrowstyle: undefined,
    leftArrowText: '',
    rightArrowText: '',
    onAnimateNextPage: undefined,
    scrollWidth: 0,
    touchDisablesAutoplay: false,
  };

  constructor(props) {
    super(props);
    const size = { width: 0, height: 0 };
    if (props.children) {
      const childrenLength = props.children.length ? props.children.length : 1;
      this.state = {
        currentPage: props.currentPage,
        size,
        childrenLength,
      };
    } else {
      this.state = { size };
    }
    this.edgeOffset = 0;
    this.maxItemsVisible = 1;
    this.pageSetBeforeScroll = false;
    this.autoplayAdvance = true;
  }

  componentDidMount() {
    if (this.state.childrenLength) {
      this._setUpTimer();
    }
  }

  conponentWillMount() {
    this._animateToPage(this.props.currentPage, false);
  }

  componentWillUnmount() {
    this._clearTimer();
  }

  componentWillReceiveProps(nextProps) {
    let childrenLength = 0;
    if (nextProps.children) {
      childrenLength = nextProps.children.length ? nextProps.children.length : 1;
    }
    this.setState({ childrenLength: childrenLength });
    this._setUpTimer();
  }

  _setEdgeOffset() {
    this.edgeOffset = 0;
    if (this.props.scrollWidth === 0) return;
    const itemSlop = this.state.size.width - this.props.scrollWidth;
    if (itemSlop > 0) this.edgeOffset = parseInt(itemSlop*-0.5, 10);
console.log("setEdgeOffset",this.state.size.width,this.props.scrollWidth,this.edgeOffset);
  }

  _onScrollBegin = () => {
    console.log('DragBegin');
    this._clearTimer();
    if (this.props.touchDisablesAutoplay) this.autoplayAdvance = false;
    if (this.pageSetBeforeScroll) this._animateToPage();
  }

  _setCurrentPage = (currentPage) => {
console.log('_setCurrentPage', currentPage);
    this.setState({ currentPage: currentPage }, () => {
      if (this.props.onAnimateNextPage) {
        // FIXME: called twice on ios with auto-scroll
        this.props.onAnimateNextPage(currentPage);
      }
    });
  }

  _onScrollEnd = (event) => {
    const offset = { ...event.nativeEvent.contentOffset };
    const page = this._calculateCurrentPage(offset.x);
console.log("currentPage=",page);
      //this._placeCritical(page);
      this._animateToPage(page);
//      this._animateToPage(page);
//    this._placeCritical(page);
//    this._setCurrentPage(page);
//    this._setUpTimer();
  }

  _calculateCurrentPage = (offset) => {
    var { width } = this.state.size;
    if (this.props.scrollWidth > 0) width = this.props.scrollWidth;
    var page = Math.floor( (offset + (width*0.5)) / width);
console.log("calc",page,offset,width);
    page-=(this.maxItemsVisible-1);

    if(this.props.infinite===false) {
      if (page<0) page=0;
      else
      if (page>=this.state.childrenLength) page=this.state.childrenLength-1;
    }

    return page;
  }

  _onLayout = () => {
    this.container.measure((x, y, w, h) => {
      this.setState({
        size: { width: w, height: h },
      });
      if (this.props.scrollWidth > 0) {
        this._setEdgeOffset();
        this.maxItemsVisible = Math.ceil(w/this.props.scrollWidth) + 1
      }
      this._placeCritical(this.state.currentPage);
    });
  }

  _clearTimer = () => {
    clearTimeout(this.timer);
  }

  _setUpTimer = () => {
    // only for cycling
    if (this.props.autoplay && this.props.children.length > 1 && this.autoplayAdvance) {
      this._clearTimer();
      this.timer = setTimeout(() => this._animateToNextPageAutoPlay(), this.props.delay);
    }
  }

  _scrollTo = (offset, animated) => {
    if (this.scrollView) {
      this.scrollView.scrollTo({ y: 0, x: offset + this.edgeOffset, animated });
    }
    console.log("ScrollTo",offset,offset+this.edgeOffset,this.edgeOffset);
  }

  _animateToPage = (page, showAnim) => {
console.log("animateToPage",page,showAnim);
    const { childrenLength } = this.state;
    this._clearTimer();

    if(this.props.infinite == false) {
      if(page<=-1 || page>=childrenLength) {
        this._placeCritical(page);
        this._setUpTimer();
        return;
      }
    }

    var { width } = this.state.size;
    if (this.props.scrollWidth > 0) width = this.props.scrollWidth;

    if (this.pageSetBeforeScroll) {
      console.log("prescroll =",this.state.currentPage,this.state.currentPage+this.maxItemsVisible-1,width);
      this.pageSetBeforeScroll = false;
      this._scrollTo( (this.state.currentPage+this.maxItemsVisible-1) * width, false);
    }
    if (page===undefined) return;

    var visiblePage = page+(this.maxItemsVisible-1);
    this._scrollTo(visiblePage * width,true);
    this._placeCritical(page);
    //this._setCurrentPage(currentPage);
    this._setUpTimer();
  }

  _placeCritical = (page) => {
console.log("placeCritical",page);
    const { childrenLength, currentPage } = this.state;
    var { width } = this.state.size;
    if (this.props.scrollWidth > 0) width = this.props.scrollWidth;

    if (childrenLength === 1) {
      page=this.maxItemsVisible-1
      this.pageSetBeforeScroll = true;
    } else {

      if (page >= childrenLength) {
        if (this.props.infinite) {
          page = 0
          this.pageSetBeforeScroll = true;
        } else {
          page = childrenLength-1;
        }
      } else
      if (page < 0) {
        if (this.props.infinite) {
          page += childrenLength;
          this.pageSetBeforeScroll = true;
        } else {
          page = 0;
        }
      }

    }

    if (page!==currentPage) this._setCurrentPage(page);

  }

  _renderPageInfo = (pageLength) =>
    <View style={styles.pageInfoBottomContainer} pointerEvents="none">
      <View style={styles.pageInfoContainer}>
        <View
          style={[styles.pageInfoPill, { backgroundColor: this.props.pageInfoBackgroundColor }]}
        >
          <Text
            style={[styles.pageInfoText, this.props.pageInfoTextStyle]}
          >
            {`${this.state.currentPage + 1}${this.props.pageInfoTextSeparator}${pageLength}`}
          </Text>
        </View>
      </View>
    </View>

  _renderBullets = (pageLength) => {
    const bullets = [];
    const selectedPage = this.state.currentPage;
//console.log("Bullets currentPage,selectedPage",this.state.currentPage,selectedPage);
    for (let i = 0; i < pageLength; i += 1) {
      bullets.push(
        <TouchableWithoutFeedback onPress={() => {
            if (this.props.touchDisablesAutoplay) this.autoplayAdvance = false;
            this._animateToPage(i,true)
          }} key={`bullet${i}`}>
          <View
            style={i === selectedPage ?
              [styles.chosenBullet, this.props.chosenBulletStyle] :
              [styles.bullet, this.props.bulletStyle]}
          />
        </TouchableWithoutFeedback>);
    }
    return (
      <View style={styles.bullets}>
        <View style={[styles.bulletsContainer, this.props.bulletsContainerStyle]}>
          {bullets}
        </View>
      </View>
    );
  }

  _animateToNextPage() {
    if (this.props.touchDisablesAutoplay) this.autoplayAdvance = false;
    this._animateToPage(this.state.currentPage + 1,true);
  }

  _animateToNextPageAutoPlay() {
    this._animateToPage(this.state.currentPage + 1,true);
  }

  _animateToPrevPage() {
    if (this.props.touchDisablesAutoplay) this.autoplayAdvance = false;
    this._animateToPage(this.state.currentPage - 1,true);
  }

  _renderArrows = () => {
    return (
      <View style={styles.arrows}>
        <View style={[styles.arrowsContainer, this.props.arrowsContainerStyle]}>
          <TouchableOpacity onPress={() => this._animateToPrevPage()} style={this.props.arrowstyle}><Text>{this.props.leftArrowText ? this.props.leftArrowText : 'Left'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => this._animateToNextPage()} style={this.props.arrowstyle}><Text>{this.props.rightArrowText ? this.props.rightArrowText : 'Right'}</Text></TouchableOpacity>
        </View>
      </View>
    );
  }


  render() {
    const { size } = this.state;
    const children = this.props.children;
    let pages = [];

    var { width } = this.state.size;
    if (this.props.scrollWidth > 0) width = this.props.scrollWidth;

    var maxItemsVisible = this.maxItemsVisible;
    console.log("maxItemsVisible",maxItemsVisible);


    if (children && children.length > 1) {
      // add pre-pages
      let i = (children.length - maxItemsVisible) + 1;
      while(i < 0)i+=children.length;
      for (j = 1; j < maxItemsVisible; j++) {
//console.log("Adding:",i);
        if (this.props.infinite) pages.push(children[i]);
        else pages.push(
          <View style={[{width: width}, styles.invisible]}></View>
        );
        i++;
        if (i === children.length) i=0;
      }

      // add all pages
      for (i = 0; i < children.length; i += 1) {
//console.log("Adding:",i);
        pages.push(children[i]);
      }
      // add post-pages
      i = 0;
      for (let j = 1; j < maxItemsVisible; j++ ) {
//console.log("Adding:",i);
        if (this.props.infinite) pages.push(children[i]);
        else pages.push(
          <View style={[{width: width}, styles.invisible]}></View>
        );
        i++;
        if (i === children.length) i=0;
      }
    } else if (children) {
      for (let j = 0; j < maxItemsVisible+2; j++ ) {
        pages.push(children);
      }
    } else {
      return (
        <Text style={{ backgroundColor: 'white' }}>
          You are supposed to add children inside Carousel
        </Text>
      );
    }

    pages = pages.map((page, i) =>
      <TouchableWithoutFeedback style={[{ ...size }, this.props.pageStyle]} key={`page${i}`}>
        {page}
      </TouchableWithoutFeedback>
    );

    const containerProps = {
      ref: (c) => { this.container = c; },
      onLayout: this._onLayout,
      style: [this.props.style],
    };

    const contents = (
      <ScrollView
        ref={(c) => { this.scrollView = c; }}
        onScrollBeginDrag={this._onScrollBegin}
        onMomentumScrollEnd={this._onScrollEnd}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        contentInset={{ top: 0 }}
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
        horizontal
        bounces={false}
        contentContainerStyle={[
          styles.horizontalScroll,
          this.props.contentContainerStyle,
          {
            width: size.width * (children.length + (children.length > 1 ? 2 : 0)),
            height: size.height,
          },
        ]}
      >
        {pages}
      </ScrollView>);

    return (
      <View {...containerProps}>
        {contents}
        {this.props.arrows && this._renderArrows(this.state.childrenLength)}
        {this.props.bullets && this._renderBullets(this.state.childrenLength)}
        {this.props.pageInfo && this._renderPageInfo(this.state.childrenLength)}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  horizontalScroll: {
    position: 'absolute',
  },
  pageInfoBottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  pageInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pageInfoPill: {
    width: 80,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageInfoText: {
    textAlign: 'center',
  },
  bullets: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    height: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  arrows: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
  arrowsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulletsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  chosenBullet: {
    margin: 10,
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  bullet: {
    margin: 10,
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderColor: 'white',
    borderWidth: 1,
  },
  invisible: {
    backgroundColor: 'transparent',
  }
});
