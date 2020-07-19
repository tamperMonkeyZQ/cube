import * as THREE from './three.js'
import { RoundedBoxGeometry } from './plugins/RoundedBoxGeometry.js';
import { RoundedPlaneGeometry } from './plugins/RoundedPlaneGeometry.js';
import Themes from './Themes';


//基础模型参数
const BasicParams = {
  x: 0,
  y: 0,
  z: 0,
  num: 3,
  len: 50,
  //右、左、上、下、前、后
  colors: ['#ff6b02', '#dd422f',
    '#ffffff', '#fdcd02',
    '#3d81f7', '#019d53']
};

/**
 * 简易魔方
 * x、y、z 魔方中心点坐标
 * num 魔方阶数
 * len 小方块宽高
 * colors 魔方六面体颜色
 */
function SimpleCube(x, y, z, num, len, colors) {
  //魔方左上角坐标
  var leftUpX = x - num/2*len;
  var leftUpY = y + num/2*len;
  var leftUpZ = z + num/2*len;

  var cubes = [];
  for (var i = 0; i < num; i++) {
    for (var j = 0; j < num * num; j++) {

      var myFaces = [];
      for (var k = 0; k < 6; k++) {
        myFaces[k] = faces(colors[k]);
      }

      var materials = [];
      for (var k = 0; k < 6; k++) {
        var texture = new THREE.Texture(myFaces[k]);
        texture.needsUpdate = true;
        materials.push(new THREE.MeshLambertMaterial({ map: texture}));
      }

      // var cubegeo = new THREE.BoxGeometry(len, len, len);
      // var cubegeo = new THREE.BoxGeometry(30, 30, 30);
      // var cube = new THREE.Mesh(cubegeo, materials);
      var cube = new THREE.Mesh(
        new RoundedBoxGeometry(20, 0.12, 3 ),
        // new THREE.MeshLambertMaterial().clone()
      );
      cube.material.color.setHex(0x08101a);

      //依次计算各个小方块中心点坐标
      cube.position.x = (leftUpX + len / 2) + (j % num) * len;
      cube.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
      cube.position.z = (leftUpZ - len / 2) - i * len;
      cubes.push(cube)
    }
  }
  return cubes;
}

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
    // this.cubes = [];
    // this.generatePositions();
    // console.log(this.positions);
		// this.generateModel();

		// this.pieces.forEach( piece => {

		// 	this.cubes.push( piece.userData.cube );
		// 	this.object.add( piece );

    // } );
    var themes = new Themes();
    // this.updateColors( themes.getColors());
    this.cubes = SimpleCube(BasicParams.x, BasicParams.y, BasicParams.z, BasicParams.num, BasicParams.len, BasicParams.colors);//生成魔方小正方体
    this.generatePositions();
    this.generateEdges();
    this.updateColors(themes.getColors());
    console.log(this.edges);
    for (var i = 0; i < this.cubes.length; i++) {
      var item = this.cubes[i];
      this.main.scene.add(item);
    }
    for (var i = 0; i < this.edges.length; i++) {
      var item = this.edges[i];
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
    const pieceSize = 21;
    const edgeGeometry = RoundedPlaneGeometry(
			pieceSize,
			this.geometry.edgeCornerRoundness,
			this.geometry.edgeDepth
    );
    this.positions.forEach( ( position, index ) => {

			const piece = new THREE.Object3D();
			const pieceEdges = [];

			piece.position.copy( position.clone().divideScalar( 3 ) );
			piece.name = index;
			piece.edgesName = '';

			position.edges.forEach( position => {

				const edge = new THREE.Mesh( edgeGeometry, mainMaterial.clone() );
				const name = [ 'L', 'R', 'D', 'U', 'B', 'F' ][ position ];
        const distance = pieceSize/2;
        console.log([ 0, 0, 0, 0, - 1, 1 ][ position ]);
				// edge.position.set(
				//   distance * [ - 1, 1, 0, 0, 0, 0 ][ position ],
				//   distance * [ 0, 0, - 1, 1, 0, 0 ][ position ],
        //   distance * [ 0, 0, 0, 0, - 1, 1 ][ position ]
        // );
        edge.position.set(
          50,
          0,
          0
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

			piece.userData.start = {
				position: piece.position.clone(),
				rotation: piece.rotation.clone(),
			};

			this.pieces.push( piece );
		} );

  }

  updateColors( colors ) {

		if ( typeof this.pieces !== 'object' && typeof this.edges !== 'object' ) return;

    // this.pieces.forEach( piece => piece.userData.cube.material.color.setHex( colors.P ) );
    // var edge = this.edges.pop();
    // edge.material.color.setHex(colors[ edge.name ])
    this.edges.forEach( edge => edge.material.color.setHex(colors[ edge.name ]));

	}
}