var EventCenter = {
	on: function(type,handler){
		$(document).on(type,handler)
	},
	fire: function(type,data){
		$(document).trigger(type,data)
	}
}


/*
EventCenter.on('hello',function(e,data){
	console.log(data)
})

EventCenter.fire('hello','hello,google')

*/

var Footer = {
	init: function(){
		this.$footer = $('footer')
		this.$ul = this.$footer.find('ul')
		this.$box = this.$footer.find('.music-box')
		this.$leftBtn = this.$footer.find('.icon-left')
		this.$rightBtn = this.$footer.find('.icon-right')
		this.isToEnd = false
		this.isToStart = true
		this.isAnimate = false
		this.bind()
		this.render()
	},
	bind: function(){
		var _this = this
		_this.$rightBtn.on('click',function(){
			if(_this.isAnimate) return 
			var itemWidth = _this.$box.find('li').outerWidth(true)
			var rowCount = Math.floor(_this.$box.width()/itemWidth)
			//console.log(_this.isToEnd)
			if(!_this.isToEnd){
				_this.isAnimate = true
				_this.$ul.animate({
					left : '-='+ itemWidth * rowCount
				},400,function(){
					_this.isAnimate = false
					_this.isToStart = false
					_this.$leftBtn.removeClass('disabled')
					if(parseFloat(_this.$box.width())-parseFloat(_this.$ul.css('left'))>=parseFloat(_this.$ul.width())){
						_this.isToEnd = true
						_this.$rightBtn.addClass('disabled')
					}
				})
			}
		})

		_this.$leftBtn.on('click',function(){
			if(_this.isAnimate) return
			var itemWidth = _this.$box.find('li').outerWidth(true)
			var rowCount = Math.floor(_this.$box.width()/itemWidth)
			if(!_this.isToStart){
				_this.isAnimate = true
				_this.$ul.animate({
					left : '+='+ itemWidth * rowCount
				},400,function(){
					_this.isAnimate = false
					_this.isToEnd = false
					_this.$rightBtn.removeClass('disabled')
					if(parseFloat(_this.$ul.css('left')) >=0 ){
						_this.isToStart = true
						_this.$leftBtn.addClass('disabled')
					}
				})
			}
		})

		// li是后续才创建的，所以需要使用事件代理
		this.$footer.on('click','li',function(){
			$(this).addClass('active').siblings().removeClass('active')
			// $('main .detail .tag').text($(this).find('h3').text())
			EventCenter.fire('select-albumn',{
				channelId: $(this).attr('data-channel-id'),
				channelName: $(this).attr('data-channel-name')
			})
		})

			
	},
	render: function(){
		var _this = this
		//$.ajax({
		//	url: 'json/channels.json',
		//	dataType: 'json'
		//})
   $.getJSON("//jirenguapi.applinzi.com/fm/getChannels.php")
    .done(function(ret){
			console.log(ret)
			_this.renderFooter(ret.channels)
		}).fail(function(){
			console.log('err:get data failed!')
		})
	},
	renderFooter: function(channels){
		var _this = this
		//console.log(channels)
		var htmlTpl = ''
		$.each(channels,function(idx,item){
			htmlTpl += '<li data-channel-id='+item.channel_id+' data-channel-name='+item.name+'>'
							 + ' <div class="cover" style="background-image: url('+item.cover_small+')"></div>'
							 + ' <h3>'+item.name+'</h3>'
						   + '</li>'
			_this.$ul.html(htmlTpl)
			_this.setStyle()
		})
	},
	setStyle: function(){
		var count = this.$footer.find('li').length
		var width = this.$footer.find('li').outerWidth(true)
		this.$ul.css({
			width: count *width +'px'
		})

	}
}


var Fm = {
	init: function(){
		this.$container = $('#page-music')
		this.audioObj = new Audio()
		this.audioObj.autoplay = true
		this.collections = this.loadFromLocal()
		this.bind()
		EventCenter.fire('select-albumn',{
				channelId: '22',
				channelName: '轻音乐'
		})
	},
	bind: function(){
		var _this = this
		EventCenter.on('select-albumn',function(e,channelObj){
			_this.channelId = channelObj.channelId
			_this.channelName= channelObj.channelName
			_this.loadMusic()
		})

		this.$container.find('.btn-collect').on('click', function(){
      var $btn = $(this)
      if($btn.hasClass('active')){
        $btn.removeClass('active')
        delete _this.collections[_this.song.sid]
      }else{
        $(this).addClass('active')
        _this.collections[_this.song.sid] = _this.song
      }
      _this.saveToLocal()
    })

		this.$container.find('.btn-play').on('click',function(){
			var $btn = $(this)
			if($btn.hasClass('icon-play')){
				$btn.removeClass('icon-play').addClass('icon-pause')
				_this.audioObj.play()
			}else{
				$btn.removeClass('icon-pause').addClass('icon-play')
				_this.audioObj.pause()
			}
		})

		this.$container.find('.btn-next').on('click',function(){
			_this.loadMusic()
		})

		
		this.audioObj.addEventListener('play',function(){
			console.log('play...')
			if(_this.statusClock){
				clearInterval(_this.statusClock)
			}
			_this.statusClock= setInterval(function(){
				_this.updateProgressStatus()
			},1000)
		})

		this.audioObj.addEventListener('pause',function(){
			console.log('pause...')
			clearInterval(_this.statusClock)
		})


		this.$container.find('.bar').on('click',function(e){
			var percent = e.offsetX / parseInt(getComputedStyle(this).width)
			_this.audioObj.currentTime = percent * _this.audioObj.duration
			_this.$container.find('.progress-now').css({
				width: percent *100+'%'
			})

			var curMin = ''+Math.floor(_this.audioObj.currentTime/60)
			var curSec = ''+Math.floor(_this.audioObj.currentTime%60)
			curMin = (curMin.length ===1)?('0'+curMin):curMin
			curSec = (curSec.length ===1)?('0'+curSec):curSec
			_this.$container.find('.current-time').text(curMin +':'+curSec)
		}) 

		this.audioObj.onended = function(){
			_this.loadMusic()
		}

	},
	loadMusic: function(){
		var _this = this
		console.log('load music...')
		$.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId})
		.done(function(ret){
			_this.song = ret['song'][0]
			if(_this.collections[_this.song.sid]){
	      _this.$container.find('.btn-collect').addClass('active')
	    }else{
	      _this.$container.find('.btn-collect').removeClass('active')
	    }
			_this.$container.find('.lyric p').text('')
			_this.setMusicDetail()
			_this.loadLyric()
		})
	},
	loadLyric: function(){
		var _this = this
		console.log('load lyric...')
		$.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid})
		.done(function(ret){
			//console.log(ret.lyric)
			var lyric  = ret.lyric
			var lyricObj = {}
			lyric.split('\n').forEach(function(line){
					//[01:39.39][02:46.39]唯望此爱爱未老
					var times = line.match(/\d{2}:\d{2}/g)
					var str = line.replace(/\[.+?\]/g,'')
					// 有些歌词行可能为空，无法匹配得到时间
					if(Array.isArray(times)){
						times.forEach(function(time){
							lyricObj[time]=str
						})
					}
					
			})
			_this.lyricObj = lyricObj
		})
	},
	setMusicDetail: function(){
		var _this = this
		//console.log(this.song)
		this.$container.find('')
		this.audioObj.src = this.song.url
		$('.bg').css('background-image','url('+this.song.picture+')')
		this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
		this.$container.find('.detail .title').text(this.song.title)
		this.$container.find('.detail .author').text(this.song.artist)
		this.$container.find('.detail .tag').text(this.channelName)
		this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')

		this.$container.find('.progress-now').css({width: '0'})
		this.$container.find('.current-time').text("00:00")
		this.audioObj.oncanplay = function(){
			var totalmin = ''+Math.floor(_this.audioObj.duration/60)
			var totalsec = ''+Math.floor(_this.audioObj.duration%60)
			totalmin = (totalmin.length ===1)?('0'+totalmin):totalmin
			totalsec = (totalsec.length ===1)?('0'+totalsec):totalsec
			_this.$container.find('.total-time').text(totalmin +':'+totalsec)
		}
	},
	updateProgressStatus: function(){
		//console.log('update...')
		var percent = (this.audioObj.currentTime / this.audioObj.duration) *100 + '%'
		this.$container.find('.progress-now').css({
			width: percent
		})
		var curMin = ''+Math.floor(this.audioObj.currentTime/60)
		var curSec = ''+Math.floor(this.audioObj.currentTime%60)
		curMin = (curMin.length ===1)?('0'+curMin):curMin
		curSec = (curSec.length ===1)?('0'+curSec):curSec
		this.$container.find('.current-time').text(curMin +':'+curSec)

		curSec = (parseInt(curSec)+1)+''
		curSec = (curSec.length ===1)?('0'+curSec):curSec
		var line = this.lyricObj[curMin +':'+curSec]
		if(line){
			//this.$container.find('.lyric p').text(line).boomText()
			this.$container.find('.lyric p').text(line)
		}
	},
	loadFromLocal: function(){
    return JSON.parse(localStorage['collections']||'{}')
  },
  saveToLocal: function(){
    localStorage['collections'] = JSON.stringify(this.collections)
  },
  loadCollection: function(){
    var keyArray = Object.keys(this.collections)
    if(keyArray.length === 0){
			return
    }
    var randomIndex = Math.floor(Math.random()* keyArray.length)
    var randomSid = keyArray[randomIndex]
    this.song = this.collections[randomSid]
    if(this.collections[this.song.sid]){
      this.$container.find('.btn-collect').addClass('active')
    }else{
      this.$container.find('.btn-collect').removeClass('active')
    }
    this.$container.find('.lyric p').text('')
    this.setMusicDetail()
    this.loadLyric()   
  }
}


$.fn.boomText = function(type){
  // https://daneden.github.io/animate.css/
  type = type || 'rollIn'
 // console.log(type)
  this.html(function(){
    var arr = $(this).text()
    .split('').map(function(word){
        return '<span class="boomText">'+ word + '</span>'
    })
    return arr.join('')
  })
  
  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  }, 300)
}



Footer.init()
Fm.init()



























































