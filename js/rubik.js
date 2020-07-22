import * as THREE from './three.js'
import { RoundedBoxGeometry } from './plugins/RoundedBoxGeometry.js';
import { RoundedPlaneGeometry } from './plugins/RoundedPlaneGeometry.js';
import Themes from './Themes';

/**
 * 生成canvas素材
 */
function faces(rgbaColor) {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  var context = canvas.getContext('2d');
  //画一个宽高都是256的黑色正方形
  context.fillStyle = 'rgba(0,0,0,1)';
  context.fillRect(0, 0, 256, 256);
  //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
  context.rect(16, 16, 224, 224);
  context.lineJoin = 'round';
  context.lineWidth = 16;
  context.fillStyle = rgbaColor;
  context.strokeStyle = rgbaColor;
  context.stroke();
  context.fill();
  return canvas;
}


export default class Rubik {
  constructor(main) {
    this.size = 3;
    this.defaultTotalTime = 250;//默认转动动画时长
    this.main = main;
    this.object = new THREE.Object3D();
    this.geometry = {
			pieceCornerRadius: 0.12,
			edgeCornerRoundness: 0.15,
			edgeScale: 0.82,
			edgeDepth: 0.01,
		};
  }
  
  model() {
    var themes = new Themes();
    this.generatePositions();
    this.generateEdges();
    this.updateColors(themes.getColors());
    for (var i = 0; i < this.pieces.length; i++) {
      var item = this.pieces[i];
      this.main.scene.add(item);
    }
  }
  generatePositions() {

    const m = this.size - 1;
    const first = this.size % 2 !== 0
      ? 0 - Math.floor(this.size / 2)
      : 0.5 - this.size / 2;
  
    let x, y, z;
  
    this.positions = [];
  
    for ( x = 0; x < this.size; x ++ ) {
      for ( y = 0; y < this.size; y ++ ) {
        for ( z = 0; z < this.size; z ++ ) {
  
          let position = new THREE.Vector3(first + x, first + y, first + z);
          let edges = [];
  
          if ( x == 0 ) edges.push(0);
          if ( x == m ) edges.push(1);
          if ( y == 0 ) edges.push(2);
          if ( y == m ) edges.push(3);
          if ( z == 0 ) edges.push(4);
          if ( z == m ) edges.push(5);
  
          position.edges = edges;
          this.positions.push( position );
  
        }
      }
    }
  
  }
  generateEdges(){
    this.pieces = [];
    this.edges = [];
    const mainMaterial = new THREE.MeshLambertMaterial();
    const pieceSize = 1/3;
		const pieceMesh = new THREE.Mesh(
			new RoundedBoxGeometry( pieceSize, this.geometry.pieceCornerRadius, 3 ),
			mainMaterial.clone()
		);
    const edgeGeometry = RoundedPlaneGeometry(
			pieceSize,
			this.geometry.edgeCornerRoundness,
			this.geometry.edgeDepth
    );
    this.positions.forEach( ( position, index ) => {

      const piece = new THREE.Object3D();
      const pieceCube = pieceMesh.clone();
			const pieceEdges = [];

      piece.position.copy( position.clone().divideScalar( 3 ) );
      piece.add( pieceCube );
			piece.name = index;
			piece.edgesName = '';

			position.edges.forEach( position => {
				const edge = new THREE.Mesh( edgeGeometry, mainMaterial.clone() );
				const name = [ 'L', 'R', 'D', 'U', 'B', 'F' ][ position ];
        const distance = pieceSize/2;
        
				edge.position.set(
				  distance * [ - 1, 1, 0, 0, 0, 0 ][ position ],
				  distance * [ 0, 0, - 1, 1, 0, 0 ][ position ],
          distance * [ 0, 0, 0, 0, - 1, 1 ][ position ]
        );

				edge.rotation.set(
				  Math.PI / 2 * [ 0, 0, 1, - 1, 0, 0 ][ position ],
				  Math.PI / 2 * [ - 1, 1, 0, 0, 2, 0 ][ position ],
			  	0
				);

				edge.scale.set(
					this.geometry.edgeScale,
					this.geometry.edgeScale,
					this.geometry.edgeScale
				);

				edge.name = name;

				piece.add( edge );
				pieceEdges.push( name );
				this.edges.push( edge );

			} );

      piece.userData.edges = pieceEdges;
      piece.userData.cube = pieceCube;

			piece.userData.start = {
				position: piece.position.clone(),
				rotation: piece.rotation.clone(),
			};

			this.pieces.push( piece );
    } );

  }

  updateColors( colors ) {

		if ( typeof this.pieces !== 'object' && typeof this.edges !== 'object' ) return;

    this.pieces.forEach( piece => piece.userData.cube.material.color.setHex( colors.P ) );
    // var edge = this.edges.pop();
    // edge.material.color.setHex(colors[ edge.name ])
    this.edges.forEach( edge => edge.material.color.setHex(colors[ edge.name ]));

  }
  
  /**
   * 转动动画
   * currentstamp 当前时间
   * startstamp   开始时间
   */
  rotateAnimation(elements, direction, currentstamp, startstamp, laststamp, callback, totalTime) {
    var self = this;
    var isAnimationEnd = false;//动画是否结束

    if (startstamp === 0) {
      startstamp = currentstamp;
      laststamp = currentstamp;
    }
    if (currentstamp - startstamp >= totalTime) {
      isAnimationEnd = true;
      currentstamp = startstamp + totalTime;
    }
    var rotateMatrix = new THREE.Matrix4();//旋转矩阵
    var origin = new THREE.Vector3(0, 0, 0);
    var xLine = new THREE.Vector3(1, 0, 0);
    var yLine = new THREE.Vector3(0, 1, 0);
    var zLine = new THREE.Vector3(0, 0, 1);

    switch (direction) {
      case 0.1:
      case 1.2:
      case 2.4:
      case 3.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, xLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 0.2:
      case 1.1:
      case 2.3:
      case 3.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, xLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 0.4:
      case 1.3:
      case 4.3:
      case 5.4:
        rotateMatrix = this.rotateAroundWorldAxis(origin, yLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 1.4:
      case 0.3:
      case 4.4:
      case 5.3:
        rotateMatrix = this.rotateAroundWorldAxis(origin, yLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 2.2:
      case 3.1:
      case 4.1:
      case 5.2:
        rotateMatrix = this.rotateAroundWorldAxis(origin, zLine, -90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      case 2.1:
      case 3.2:
      case 4.2:
      case 5.1:
        rotateMatrix = this.rotateAroundWorldAxis(origin, zLine, 90 * Math.PI / 180 * (currentstamp - laststamp) / totalTime);
        break;
      default:
        break;
    }
    for (var i = 0; i < elements.length; i++) {
      elements[i].applyMatrix(rotateMatrix);
    }
    if (!isAnimationEnd) {
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, startstamp, currentstamp, callback, totalTime);
      });
    } else {
      callback();
    }
  }
    /**
   * 计算转动方向
   */
  getDirection(sub, normalize) {
    this.updateCurLocalAxisInWorld();
    var direction;
    //判断差向量和x、y、z轴的夹角
    var xAngle = sub.angleTo(this.xLine);
    var xAngleAd = sub.angleTo(this.xLineAd);
    var yAngle = sub.angleTo(this.yLine);
    var yAngleAd = sub.angleTo(this.yLineAd);
    var zAngle = sub.angleTo(this.zLine);
    var zAngleAd = sub.angleTo(this.zLineAd);
    var minAngle = Math.min.apply(null, [xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);//最小夹角

    var xLine = new THREE.Vector3(1, 0, 0);
    var xLineAd = new THREE.Vector3(-1, 0, 0);
    var yLine = new THREE.Vector3(0, 1, 0);
    var yLineAd = new THREE.Vector3(0, -1, 0);
    var zLine = new THREE.Vector3(0, 0, 1);
    var zLineAd = new THREE.Vector3(0, 0, -1);

    switch (minAngle) {
      case xAngle:
        direction = 0;//向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;//绕z轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;//绕z轴逆时针
        } else if (normalize.equals(zLine)) {
          direction = direction + 0.3;//绕y轴逆时针
        } else {
          direction = direction + 0.4;//绕y轴顺时针
        }
        break;
      case xAngleAd:
        direction = 1;//向x轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(zLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case yAngle:
        direction = 2;//向y轴正方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case yAngleAd:
        direction = 3;//向y轴反方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case zAngle:
        direction = 4;//向z轴正方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      case zAngleAd:
        direction = 5;//向z轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;
        } else if (normalize.equals(xLine)) {
          direction = direction + 0.3;
        } else {
          direction = direction + 0.4;
        }
        break;
      default:
        break;
    }
    return direction;
  }

  /**
   * 根据触摸方块的索引以及滑动方向获得转动元素
   */
  getBoxs(cubeIndex, direction) {
    var targetIndex = cubeIndex;
    targetIndex = targetIndex - this.minCubeIndex;
    var numI = parseInt(targetIndex / 9);
    var numJ = targetIndex % 9;
    var boxs = [];
    //根据绘制时的规律判断 no = i*9+j
    switch (direction) {
      case 0.1:
      case 0.2:
      case 1.1:
      case 1.2:
      case 2.3:
      case 2.4:
      case 3.3:
      case 3.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
          if (numI === parseInt(tempId / 9)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      case 0.3:
      case 0.4:
      case 1.3:
      case 1.4:
      case 4.3:
      case 4.4:
      case 5.3:
      case 5.4:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
          if (parseInt(numJ / 3) === parseInt(tempId % 9 / 3)) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      case 2.1:
      case 2.2:
      case 3.1:
      case 3.2:
      case 4.1:
      case 4.2:
      case 5.1:
      case 5.2:
        for (var i = 0; i < this.cubes.length; i++) {
          var tempId = this.cubes[i].cubeIndex - this.minCubeIndex;
          if (tempId % 9 % 3 === numJ % 3) {
            boxs.push(this.cubes[i]);
          }
        }
        break;
      default:
        break;
    }
    return boxs;
  }
  /**
   * 转动魔方整体
   */
  rotateMoveWhole(direction, callback, totalTime) {
    if (direction != null) {
      var self = this;
      totalTime = totalTime ? totalTime : this.defaultTotalTime;
      var elements = this.pieces;
      requestAnimationFrame(function (timestamp) {
        self.rotateAnimation(elements, direction, timestamp, 0, 0, function () {
          if (callback) {
            callback();
          }
        }, totalTime);
      });
    }
  }
  /**
   * 绕过点p的向量vector旋转一定角度
   */
  rotateAroundWorldAxis(p, vector, rad) {
    vector.normalize();
    var u = vector.x;
    var v = vector.y;
    var w = vector.z;

    var a = p.x;
    var b = p.y;
    var c = p.z;

    var matrix4 = new THREE.Matrix4();

    matrix4.set(u * u + (v * v + w * w) * Math.cos(rad), u * v * (1 - Math.cos(rad)) - w * Math.sin(rad), u * w * (1 - Math.cos(rad)) + v * Math.sin(rad), (a * (v * v + w * w) - u * (b * v + c * w)) * (1 - Math.cos(rad)) + (b * w - c * v) * Math.sin(rad),
      u * v * (1 - Math.cos(rad)) + w * Math.sin(rad), v * v + (u * u + w * w) * Math.cos(rad), v * w * (1 - Math.cos(rad)) - u * Math.sin(rad), (b * (u * u + w * w) - v * (a * u + c * w)) * (1 - Math.cos(rad)) + (c * u - a * w) * Math.sin(rad),
      u * w * (1 - Math.cos(rad)) - v * Math.sin(rad), v * w * (1 - Math.cos(rad)) + u * Math.sin(rad), w * w + (u * u + v * v) * Math.cos(rad), (c * (u * u + v * v) - w * (a * u + b * v)) * (1 - Math.cos(rad)) + (a * v - b * u) * Math.sin(rad),
      0, 0, 0, 1);

    return matrix4;
  }
}