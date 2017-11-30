// 基于gm模块实现的验证码
var gm = require('gm');
var path = require('path');

function gen(ch, len) {
	var ret = '';
	for( var i=0; i<len; i++ ) {
		ret += String.fromCharCode(ch.charCodeAt(0) + i);
	}
	return ret;
}

function rand(max, min) {
	min = min || 0;
	max = max || 9;
	if( max < min ) {
		var tmp = max;
		max = min;
		min = tmp;
	}
	return min + Math.round(Math.random() * (max-min));
}

function color(max, min) {
	max = max || 255;
	mn = min || 0;
	var r = rand(max, min).toString(16);
	var g = rand(max, min).toString(16);
	var b = rand(max, min).toString(16);

	return '#' + (r.length == 2 ? r: '0' + r) 
						 + (g.length == 2 ? g: '0' + g) 
						 + (b.length == 2 ? b: '0' + b) ;
}

function genChar(type, ctype, len) {
	// number alpha all
	type = type || 'all';
	// lower upper all
	ctype = ctype || 'all';
	len = len || 6;

	var allstr = '';
	var number = '23456789';
	var alpha = 'abcdefghijkmnpqrstuvwxyz';

	if( type == 'number' || type == 'all' ) {
		allstr += number;
	}
	if( (type == 'alpha' || type == 'all') 
		&& (ctype == 'lower' || ctype == 'all')) {
		allstr += alpha;
	}
	if( (type == 'alpha' || type == 'all') 
		&& (ctype == 'upper' || ctype == 'all')) {
		allstr += alpha.toUpperCase();
	}
	var charStr = '', strlen = allstr.length;
	for( var i=0; i<len; i++ ) {
		charStr += allstr.charAt(rand(strlen-1));
	}
	return charStr;
}

function defer() {
	var deferred = {};
	deferred.promise = new Promise(function(resolve, reject){
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

module.exports = function(conf) {
	conf = conf || {};

	conf.bgColor = conf.bgColor || '#ffffff';
	conf.bgImage = conf.bgImage || '';
	conf.border = conf.border || [1, 1];
	conf.borderColor = conf.borderColor || '#000000';

	conf.color = conf.color || color();
	conf.strokeWidth = conf.strokeWidth || 1;
	conf.fontSize = conf.fontSize || 32;
	conf.fontFamily = conf.fontFamily || 'arial';

	conf.height = conf.height || 48;
	conf.width = conf.width || 120;

	conf.type = conf.type || 'all';
	conf.ctype = conf.ctype || 'all';
	conf.count = conf.count || 4;

	conf.format = conf.format || 'jpeg';

	// 设置偏移
	conf.drawX = typeof conf.drawX == 'undefined' ? 6 : conf.drawX
	conf.drawY = typeof conf.drawY == 'undefined' ? conf.fontSize+6 : conf.drawY

	conf.noise = typeof conf.noise == 'undefined' ? 'impulse' : conf.noise;
	conf.swirl = typeof conf.swirl == 'undefined' ? 15 : conf.swirl;
	conf.blur = typeof conf.blur == 'undefined' ? false: conf.blur;
	conf.edge = typeof conf.edge == 'undefined' ? 0 : conf.edge;


	var charStr = conf.generate && conf.generate() || 
		genChar(conf.type, conf.ctype, conf.count);

	var w = conf.width, h = conf.height;
	var cw = Math.floor(w/conf.count);

	var deferred = defer();

	if( conf.bgImage ) {
		// 图片上随机裁取图片
		var gmInst = gm(conf.bgImage)
		gmInst.size(function(err, dim) {
			if( err ) {
				return deferred.reject(err);
			} 
			var sx = rand(dim.width-w, 0),
				sy = rand(dim.height-h, 0);
			deferred.resolve(gmInst.crop(w, h, sx, sy));
		});
	} else {
		// 创建图片
		deferred.resolve(gm(w, h, conf.bgColor));
	}
	return deferred.promise.then(function(gmInst) {
		
		gmInst
			// 设置border和颜色
			.border(conf.border[0], conf.border[1])
			.borderColor(conf.borderColor)

			// 字体设置
			.fontSize(conf.fontSize)
			.font(conf.fontFamily)
			// 颜色和粗细
			.stroke(conf.color, conf.strokeWidth);

		// 绘制验证码
		for( var i=0; i<conf.count; i++ ) {
			gmInst.drawText(conf.drawX+i*cw, conf.drawY, charStr.charAt(i))
		}

		// 噪点
		if( conf.noise ) {
			gmInst.noise(conf.noise)
		}

		// 扭曲
		if( conf.swirl ) {
			gmInst.swirl(conf.swirl);
		}
		
		// 轮廓
		if( conf.edge ) {
			gmInst.edge(conf.edge);	
		}

		// 模糊
		if( conf.blur ) {
			gmInst.blur(conf.blur[0], conf.blur[1])
		}

		// 返回图片和字符
		var innerDefer = defer();
		// 耗时30ms左右
		gmInst.toBuffer(conf.format, function (err, buffer) {
			if( err ) {
				innerDefer.reject(err);
			} else {
				innerDefer.resolve({
					buffer: buffer, 
					text: charStr
				});
			}
		});
		return innerDefer.promise;
	});
}