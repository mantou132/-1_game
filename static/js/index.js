function Ship(ctx){
	this.width = ctx.canvas.width * .4906;
	this.height = ctx.canvas.width * .3656;
	this.left = gameMonitor.w/2 - this.width/4;
	this.top = gameMonitor.h - this.height;
	this.player = gameMonitor.im.createImage(gameMonitor.fg.src);

	this.paint = function(){
		ctx.drawImage(this.player, this.left, this.top, this.width/2, this.height/2);
	}

	this.setPosition = function(event){
		if(gameMonitor.isMobile()){
			var tarL = event.changedTouches[0].clientX;
			var tarT = event.changedTouches[0].clientY;
		}
		else{
			var tarL = event.offsetX;
			var tarT = event.offsetY;
		}
		this.left = tarL - this.width/4;
		this.top = tarT - this.height/4;
		if(this.left<0){
			this.left = 0;
		}
		if(this.left>gameMonitor.w-this.width/2){
			this.left = gameMonitor.w-this.width/2;
		}
		if(this.top<0){
			this.top = 0;
		}
		if(this.top>gameMonitor.h - this.height/2){
			this.top = gameMonitor.h - this.height/2;
		}
		this.paint();
	}

	this.controll = function(){
		var _this = this;
		var stage = $('#stage');
		var currentX = this.left,
			currentY = this.top,
			move = false;
		stage.on(gameMonitor.eventType.start, function(event){
			_this.setPosition(event);
			move = true;
		}).on(gameMonitor.eventType.end, function(){
			move = false;
		}).on(gameMonitor.eventType.move, function(event){
			event.preventDefault();
			if(move){
				_this.setPosition(event);	
			}
			
		});
	}

	this.eat = function(foodlist){//mantou : panduan shi fuo pengzhuang
		for(var i=foodlist.length-1; i>=0; i--){
			var f = foodlist[i];
			if(f){
				var l1 = this.top+this.height/4 - (f.top+f.height/2);
				var l2 = this.left+this.width/4 - (f.left+f.width/2);
				var l3 = Math.sqrt(l1*l1 + l2*l2);
				if(l3<=this.height/4 + f.height/2){
					foodlist[f.id] = null;
					if(f.type==0){
						gameMonitor.stop();
						$('#gameoverPanel').show();

						setTimeout(function(){
							$('#gameoverPanel').hide();
							$('#resultPanel').show();
							gameMonitor.getScore();
						}, 2000);
					}
					else{
						$('#score').text(++gameMonitor.score);
						//gameMonitor.audio.play();
						$('.heart').removeClass('hearthot').addClass('hearthot');
						setTimeout(function() {
							$('.heart').removeClass('hearthot')
						}, 200);
					}
				}
			}
			
		}
	}
}

function Food(type, left, id, ctx){
	this.speedUpTime = 180;//3s
	this.id = id;
	this.type = type;
	this.width = ctx.canvas.width * .16;
	this.height = ctx.canvas.width * .16;
	this.left = left;
	this.top = -ctx.canvas.width * .16;
	this.speed = 0.08 * Math.pow(1.1, Math.floor(gameMonitor.time/this.speedUpTime));
	this.loop = 0;
	this.angle = 0;
	this.angleable = !(type || Math.random() < .9);

	var icon = gameMonitor.icons[Math.floor(Math.random()*gameMonitor.icons.length)];
	var p = this.type == 0 ? icon : gameMonitor.icon_fg.src;

	this.pic = gameMonitor.im.createImage(p);
}
Food.prototype.paint = function(ctx){
	this.angle += Math.PI / 180 * 10;
	if(this.angleable){
		ctx.translate(this.left + this.width/2, this.top + this.height/2);
		ctx.rotate(this.angle);
		ctx.drawImage(this.pic, -this.width/2, -this.height/2, this.width, this.height);
		ctx.rotate(-this.angle);
		ctx.translate(-this.left - this.width/2, -this.top - this.height/2);
	}else{
		ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
	}
}
Food.prototype.move = function(ctx){
	if(gameMonitor.time % this.speedUpTime == 0){
		this.speed *= 1.3;
	}
	this.loop += gameMonitor.h / 550;
	this.top += this.loop * this.speed;
	if(this.top>gameMonitor.h){
	 	gameMonitor.foodList[this.id] = null;
	}
	else{
		this.paint(ctx);
	}
}

//img cache
function ImageMonitor(){
	var imgArray = [];
	return {
		createImage : function(src){
			return typeof imgArray[src] != 'undefined' ? 
				imgArray[src] : 
				(imgArray[src] = new Image(), imgArray[src].src = src, imgArray[src]);
		},
		loadImage : function(arr, callback){
			var l = arr.length;
			for(var i=0; i<l; i++){
				var img = arr[i];
				imgArray[img] = new Image();
				imgArray[img].onload = function(){
					console.log('loaded: ' + this.src);
					--l;//script runed then --l.
					if(!l && typeof callback=='function'){
						callback();
					}
					this.loaded = true;
				}
				imgArray[img].src = img
				console.log('loading: ' + img);
			}
		}
	}
}


var gameMonitor = {
	w : 0, //canvas宽度
	h : 0, //canvas高度
	time : 0, //计时
	timmer : null, //计时器
	bg : new Image(), // 背景图片
	fg : new Image(), //前景图片
	icon_fg : new Image(), // 加分图标
	bgDistance : 0, //背景位置
	score : 0, // 分数
	im : new ImageMonitor, //图片缓存
	foodList : [], //当前画布上的图片
	icons : [], // 旧物列表
	start : null, //动画状态
	ctx : document.getElementById('stage').getContext('2d'), //canvas 2D上下文引用
	//audio : new Audio(''), //加分播放音频
	bgAudio : new Audio(''),
	shareTitle: '旧物回收，+1开启新生活',
	eventType : { // 事件模式
		start : 'touchstart',
		move : 'touchmove',
		end : 'touchend'
		},
	init : function(w,h){
		var _this = this;
		_this.w = w;
		_this.h = h;

		_this.ctx.canvas.width = w;
		_this.ctx.canvas.height = h;

		document.title = _this.shareTitle;

		//初始某些元件尺寸，适应设备尺寸
		$('#scorecontent').css('font-size',_this.w/30);
		$(document.body).css('height',_this.h);

		try{
			screen.orientation.lock('portrait')
				.then(function(argument) {
					console.log(argument);
				});
		} catch(e){
			try{ screen.mozLockOrientation('portrait'); }
			catch(e){console.log('non Orientation')}
		}

		//绘制景
		_this.bg.src = 'static/img/im_gamebg.png';
		_this.fg.src = 'static/img/ic_gamecharacter.png';
		_this.icon_fg.src = 'static/img/icon/ic_heart.png';
		var ic_gguide = ['static/img/ic_gguide.png','static/img/icon.png'];


		_this.icons = [
					'static/img/icon/icon_category_binggui 15@3x.png',
					'static/img/icon/icon_category_bottle@2x.png',
					'static/img/icon/icon_category_bottle copy 11@3x.png',
					'static/img/icon/icon_category_bottle copy@2x.png',
					'static/img/icon/icon_category_bottle copy 3@2x.png',
					'static/img/icon/icon_category_bottle copy 6@2x.png',
					'static/img/icon/icon_category_bottle copy 7@2x.png',
					'static/img/icon/icon_category_chiller@2x.png',
					'static/img/icon/icon_category_cloth@2x.png',
					'static/img/icon/icon_category_freezer@2x.png',
					'static/img/icon/icon_category_paper@2x.png',
					'static/img/icon/icon_category_phone@2x.png',
					'static/img/icon/icon_category_shoe@3x.png',
					'static/img/icon/icon_category_tv@2x.png',
					'static/img/icon/icon_category_weibolu copy 13@3x.png',
					'static/img/icon/icon_category_xiyiji copy 14@3x.png',
				];
		var loading = this.icons.concat(_this.bg.src,_this.fg.src,_this.icon_fg.src,ic_gguide);

		console.log('loading start...');
		_this.im.loadImage(loading,function(){
			_this.ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);
			$('#guidePanel').css('background-image','url(' + ic_gguide[0] + '),url(' + ic_gguide[1] + ')');
			$('#loadingText').hide();
			console.log('loading end');
			_this.initListener();
		})
	},

	initListener : function(){
		var _this = this;
		var body = $(document.body);
		// $(document).on(gameMonitor.eventType.move, function(event){
		// 	event.preventDefault();
		// });
		body.on(gameMonitor.eventType.start, '#replay', function(event){
			$('#resultPanel').hide();
			_this.ship = new Ship(_this.ctx);
      		_this.ship.controll();
      		_this.reset();
			_this.run();
			_this.bgAudioPaly();
		});
		body.on(gameMonitor.eventType.start, '#share', function(event){
			$('#weixin').show();
		});
		body.on(gameMonitor.eventType.start, '#weixin', function(event){
			$('#weixin').hide();
		});
		body.on(gameMonitor.eventType.start, '#btn_1', function(event){
			$('#page_1').show();
			$.get('/visit/jiayi');
			// $('#page_1').css('width',_this.w + _this.w - $('#page_1')[0].scrollWidth);
		});
		body.on(gameMonitor.eventType.start, '#btn_9', function(event){
			// $('#page_9').show();
			$.ajax({
				url: '/visit/tuzibenyue', 
				success: function(res){
					location.href = 'http://js-9beike-cn.b0.upaiyun.com/actives/jiayi/index.html';
				},
				error: function(xhr, type){
					location.href = 'http://js-9beike-cn.b0.upaiyun.com/actives/jiayi/index.html';
				}
			});
		});

		// body.on(gameMonitor.eventType.start, '#frontpage', function(){
		// 	$('#frontpage').css('left', '-100%');
		// });

		body.on(gameMonitor.eventType.start, '#guidePanel', function(){
			$(this).hide();
			_this.ship = new Ship(_this.ctx);
			_this.ship.paint();
      		_this.ship.controll();
			_this.run();
			_this.bgAudioPaly();
		});

		_this.bgAudio.addEventListener('ended', function () {
			setTimeout(function(){
				_this.bgAudioPaly;
			}, 3000);
		},false)

		// body.on(gameMonitor.eventType.start, '.share', function(){
		// 	$('.share_page').show().on(gameMonitor.eventType.start, function(){
		// 		$(this).hide();
		// 	});
		// });

	},
	bgAudioPaly : function(e) {
			var a = this.bgAudio;
			a.play();
			a.volume = 0;
			var timer = setInterval(function() {
				if (a.volume <  0.5) {
					a.volume = (a.volume + 0.1).toFixed(1);
				}else{
					clearInterval(timer);
				}
			}, 200);
	},
	bgAudioPause : function(e) {
			var a = this.bgAudio;
			var timer = setInterval(function() {
				if (a.volume >  0) {
					a.volume = (a.volume - 0.1).toFixed(1);
				}else{
					clearInterval(timer);
					a.pause();
				}
			}, 200);
	},
	//手动设置滚动位置 0.78
	rollBg : function(){
		var tag = 0.78;
		var ctx = this.ctx;
		var w = this.w;
		var h = this.h;
		var bgW = this.bg.naturalWidth;
		var bgH = this.bg.naturalHeight;

		if(this.bgDistance >= bgW - 1){
			this.bgDistance = 0;
		}
		this.bgDistance += .5;
		// 分别绘制上左，上右
		ctx.drawImage(this.bg, this.bgDistance, 0, bgW - this.bgDistance, bgH * tag, 0, 0, w * (bgW - this.bgDistance)/bgW , h * tag);
		ctx.drawImage(this.bg, 0, 0, this.bgDistance, bgH * tag, (bgW - this.bgDistance)/bgW * w, 0, this.bgDistance/bgW * w, h * tag);
	},
	run : function(timestamp){
		var _this = this;

		//清除画布的2种方式，不过这里直接覆盖绘制
		//ctx.clearRect(0, 0, _this.bgWidth, _this.bgHeight);
		//ctx.width = _this.w;
		
		//直接粘贴背景
		_this.ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);

		//绘制滚动背景
		_this.rollBg();

		//绘制飞船
		_this.ship.paint();

		// check
		_this.ship.eat(_this.foodList);


		//产生icon
		_this.genorateFood();

		//绘制
		for(i=_this.foodList.length-1; i>=0; i--){
			var f = _this.foodList[i];
			if(f){
				f.paint(_this.ctx);
				f.move(_this.ctx);
			}
			
		}

		// android >= 4.3,还需要大改
		if ( window.requestAnimationFrame1 ) {
			_this.timmer = requestAnimationFrame(function(){//next run
				_this.run();
			});
		}else{
			_this.timmer = setTimeout(function(){
				_this.run();//可以直接使用函数名
			}, Math.round(1000/60));

			_this.time++;
		}
	},
	//mantou: game state save, can run.
	stop : function(){
		var _this = this;
		var cleartimmer = window.cancelAnimationFrame1 || window.clearTimeout;
		$('#stage').off(gameMonitor.eventType.start + ' ' +gameMonitor.eventType.move);
		setTimeout(function(){
			cleartimmer(_this.timmer);
		}, 0);
		_this.bgAudioPause();
		
	},
	genorateFood : function(){
		var genRate = 50 / Math.pow(this.score+1, 1/3); //产生one fp/n
		var random = Math.random();
		if(random*genRate>genRate-1){
			var left = Math.random()*this.w -80/2;
			var type = Math.floor(left)%3 < 2 ? 0 : 1;
			var id = this.foodList.length;
			var f = new Food(type, left, id, this.ctx);
			this.foodList.push(f);
		}
	},
	reset : function(){
		this.foodList = [];
		this.bgloop = 0;
		this.score = 0;
		this.timmer = null;
		this.time = 0;
		$('#score').text(this.score);
		document.title = this.shareTitle;
	},
	getScore : function(){
		var p;
		var score = this.score;
		if(score==0){
			$('#scorecontent').html('真桑心，肯定是因为没有认真玩的原因！要不再重新来一次！');
			document.title = '真桑心，缺爱';
			return;
		} else if (score >= 1 && score <= 5) {
            p = '60%';
        } else if (score >= 6 && score <= 10) {
            p = '70%';
        } else if (score >= 11 && score <= 15) {
            p = '80%';
        } else if (score >= 16 && score <= 20) {
            p = '90%';
        } else if (score >= 21 && score <= 25) {
            p = '100%';
        }
		$('#scorecontent').html('哎呦，不错哦！你遇见真爱的系数为'+ score +'！');
		document.title = '我接到了'+ score +'颗爱心！2016年，' + 
		(score < 26 ? 
		('我遇见真爱的几率居然有'+ p +'！') :
        '我居然可以和心爱的TA领证了！！');
	},
	isMobile : function(){
		var sUserAgent= navigator.userAgent.toLowerCase(),
		bIsIpad= sUserAgent.match(/ipad/i) == "ipad",
		bIsIphoneOs= sUserAgent.match(/iphone os/i) == "iphone os",
		bIsMidp= sUserAgent.match(/midp/i) == "midp",
		bIsUc7= sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4",
		bIsUc= sUserAgent.match(/ucweb/i) == "ucweb",
		bIsAndroid= sUserAgent.match(/android/i) == "android",
		bIsCE= sUserAgent.match(/windows ce/i) == "windows ce",
		bIsWM= sUserAgent.match(/windows mobile/i) == "windows mobile",
		bIsWebview = sUserAgent.match(/webview/i) == "webview";
		return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM);
     }
}
if(!gameMonitor.isMobile()){
	gameMonitor.eventType.start = 'mousedown';
	gameMonitor.eventType.move = 'mousemove';
	gameMonitor.eventType.end = 'mouseup';
}

// alert(innerWidth);
// gameMonitor.init(gameMonitor.isMobile() ? ($(document.documentElement).css('font-size',innerWidth / 10), innerWidth) : ($(document.body).css('width','320px'), $(document.documentElement).css('font-size',"32px"), 320),gameMonitor.isMobile() ? innerHeight : 568);//w,h
gameMonitor.init(($(document.documentElement).css('font-size',innerWidth / 10), innerWidth), innerHeight);//w,h
