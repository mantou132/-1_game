function Ship(ctx){
	this.width = 157;
	this.height = 117;
	this.left = gameMonitor.w/2 - this.width/4;
	this.top = gameMonitor.h - this.height;
	this.player = gameMonitor.im.createImage(gameMonitor.fg.src);

	this.paint = function(){
		ctx.drawImage(this.player, 0, 0, this.width, this.height, this.left, this.top, this.width/2, this.height/2);
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
		if(this.left>320-this.width/2){
			this.left = 320-this.width/2;
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
						}, 3000);
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
	this.width = 50;
	this.height = 50;
	this.left = left;
	this.top = -50;
	this.speed = 0.08 * Math.pow(1.1, Math.floor(gameMonitor.time/this.speedUpTime));
	this.loop = 0;
	this.angle = 0;

	var icon = gameMonitor.icons[Math.floor(Math.random()*gameMonitor.icons.length)];
	var p = this.type == 0 ? icon : gameMonitor.icon_fg.src;
	this.pic = gameMonitor.im.createImage(p);
}
Food.prototype.paint = function(ctx){
	// this.angle += Math.PI / 180;
	// ctx.translate(this.left + this.width/2, this.top + this.height/2);
	// ctx.rotate(this.angle);
	ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
	// ctx.rotate(-this.angle);
	// ctx.translate(-this.left - this.width/2, -this.top - this.height/2);
}
Food.prototype.move = function(ctx){
	if(gameMonitor.time % this.speedUpTime == 0){
		this.speed *= 1.3;
	}
	this.top += ++this.loop * this.speed;
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
			//asyn load img, onload event is callback function fangzaizhixingduilie,namezhixingduilieshishenme.
			for(var i=0; i<l; i++){
				var img = arr[i];
				imgArray[img] = new Image();
				imgArray[img].onload = function(){
					console.log('loaded: ' + this.src);
					--l;
					if(!l && typeof callback=='function'){
						callback();
					}
					this.loaded = true;
				}
				imgArray[img].src = img
				console.log('loadding: ' + img);
			}
		}
	}
}


var gameMonitor = {
	w : 0,
	h : 0,
	bgWidth : 750,
	bgHeight : 1334,
	time : 0,
	timmer : null,
	bg : new Image(),
	fg : new Image(),
	icon_fg : new Image(),
	bgSpeed : 2,
	bgloop : 0,
	score : 0,
	im : new ImageMonitor,
	foodList : [],
	icons : [],
	canvasId : 'stage',
	//audio : new Audio(''),
	bgDistance : 0,//背景位置
	eventType : {
		start : 'touchstart',
		move : 'touchmove',
		end : 'touchend'
	},
	init : function(w,h){
		var _this = this;
		_this.w = w;
		_this.h = h;

		var canvas = document.getElementById(_this.canvasId);
		canvas.width = w;
		canvas.height = h;
		var ctx = canvas.getContext('2d');

		//绘制景
		_this.bg.src = 'static/img/im_gamebg.png';
		_this.fg.src = 'static/img/ic_gamecharacter.png';
		_this.icon_fg.src = 'static/img/icon/ic_heart.png';


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
		var loading = this.icons.concat(_this.bg.src,_this.fg.src,_this.icon_fg.src);

		_this.bg.addEventListener('load', function () {
			ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);
		}, false);

		var loadingText = document.createElement('div');
		loadingText.id = 'loadingText';
		loadingText.textContent = 'loadding...';
		loadingText.style.position = 'absolute';
		loadingText.style.top = '0px';
		loadingText.style.margin = 'auto';
		loadingText.style.width = '100%';
		loadingText.style.height = '1000px';
		loadingText.style.paddingTop = '38px';
		loadingText.style.textAlign = 'center';
		loadingText.style.color = '#fff';
		loadingText.style.backgroundColor = 'rgba(0,0,0,0.8)';
		$(document.body).append(loadingText);

		console.log('loding start...');
		_this.im.loadImage(loading,function(){
			loadingText.parentElement.removeChild(loadingText);
			console.log('loding end');
			_this.initListener(ctx);
		})
},

	initListener : function(ctx){
		var _this = this;
		var body = $(document.body);
		$(document).on(gameMonitor.eventType.move, function(event){
			event.preventDefault();
		});
		body.on(gameMonitor.eventType.start, '#replay', ctx, function(event){
			$('#resultPanel').hide();
			_this.ship = new Ship(event.data);
      		_this.ship.controll();
      		_this.reset();
			_this.run(event.data);
		});
		body.on(gameMonitor.eventType.start, '#share', ctx,function(event){
			//???
		});
		body.on(gameMonitor.eventType.start, '#btn_1', ctx,function(event){
			//show +1 share page
		});
		body.on(gameMonitor.eventType.start, '#btn_9', ctx,function(event){
			//show 9 share page
		});

		// body.on(gameMonitor.eventType.start, '#frontpage', function(){
		// 	$('#frontpage').css('left', '-100%');
		// });

		body.on(gameMonitor.eventType.start, '#guidePanel', function(){
			$(this).hide();
			_this.ship = new Ship(ctx);
			_this.ship.paint();
      		_this.ship.controll();
			_this.run(ctx);
		});

		// body.on(gameMonitor.eventType.start, '.share', function(){
		// 	$('.share_page').show().on(gameMonitor.eventType.start, function(){
		// 		$(this).hide();
		// 	});
		// });

	},
/*	rollBg : function(ctx){
		if(this.bgDistance>=this.bgHeight){
			this.bgloop = 0;
		}
		this.bgDistance = ++this.bgloop * this.bgSpeed;
		ctx.drawImage(this.bg, 0, this.bgDistance-this.bgHeight, this.bgWidth, this.bgHeight);
		ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight);
	},*/
	run : function(ctx){
		var _this = gameMonitor;
		//ctx.clearRect(0, 0, _this.bgWidth, _this.bgHeight);
		//ctx.height = _this.h;
		//ctx.width = _this.w;

		//_this.rollBg(ctx);
		ctx.drawImage(this.bg, 0, 0, _this.bgWidth, _this.bgHeight, 0, 0, _this.w, _this.h);

		//绘制飞船
		_this.ship.paint();
		_this.ship.eat(_this.foodList);


		//产生
		_this.genorateFood();

		//绘制
		for(i=_this.foodList.length-1; i>=0; i--){
			var f = _this.foodList[i];
			if(f){
				f.paint(ctx);
				f.move(ctx);
			}
			
		}
		_this.timmer = setTimeout(function(){
			gameMonitor.run(ctx);
		}, Math.round(1000/60));

		_this.time++;
	},
	//mantou: game state save, can run.
	stop : function(){
		var _this = this
		$('#stage').off(gameMonitor.eventType.start + ' ' +gameMonitor.eventType.move);
		setTimeout(function(){
			clearTimeout(_this.timmer);
		}, 0);
		
	},
	genorateFood : function(){
		var genRate = 30; //产生one fp/n
		var random = Math.random();
		if(random*genRate>genRate-1){
			var left = Math.random()*this.w -80/2;
			var type = Math.floor(left)%3 < 2 ? 0 : 1;
			var id = this.foodList.length;
			var f = new Food(type, left, id, this.icons);
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
	},
	getScore : function(){
		
		var score = this.score;
		/*var time = Math.floor(this.time/60);
		var user = 1;*/
		if(score==0){
			$('#scorecontent').html('真桑心，肯定是因为没有认真玩的原因！要不再重新来一次！');
			// $('.btn1').text('本大侠再战一次').removeClass('share').addClass('playagain');
			// $('#fenghao').removeClass('geili yinhen').addClass('yinhen');
			return;
		}/*
		else if(score<10){
			user = 2;
		}
		else if(score>10 && score<=20){
			user = 10;
		}
		else if(score>20 && score<=40){
			user = 40;
		}
		else if(score>40 && score<=60){
			user = 80;
		}
		else if(score>60 && score<=80){
			user = 92;
		}
		else if(score>80){
			user = 99;
		}
		$('#fenghao').removeClass('geili yinhen').addClass('geili');*/
		$('#scorecontent').html('哎呦，不错哦！你将在<span id="sscore" class="lighttext">21341</span>段桃花运后遇见自己的真爱哦！');
		//$('#stime').text(time);
		$('#sscore').text(score);
		//$('#suser').text(user+'%');
		//$('.btn1').text('这么好的运气，一定要到小伙伴们那边得瑟得瑟！').removeClass('playagain').addClass('share');
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
gameMonitor.init(gameMonitor.isMobile() ? innerWidth : ($(document.body).css('width','320px'), 320),gameMonitor.isMobile() ? innerHeight : 568);//w,h
