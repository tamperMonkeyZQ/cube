import * as THREE from './js/three'
import BasicRubik from './js/rubik'

const Context = canvas.getContext('webgl');

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {

    this.context = Context;//绘图上下文
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.devicePixelRatio = window.devicePixelRatio;
    this.viewCenter = new THREE.Vector3(0, 0, 0);//原点

    this.raycaster = new THREE.Raycaster();//碰撞射线
    this.rubik;//魔方对象
    this.intersect;//射线碰撞的元素
    this.normalize;//滑动平面法向量
    this.targetRubik;//目标魔方
    this.anotherRubik;//非目标魔方
    this.startPoint;//触摸点
    this.movePoint;//滑动点
    this.isRotating = false;//魔方是否正在转动

    this.initRender();
    this.initCamera();
    this.initScene();
    this.initLight();
    this.initObject();
    this.initEvent();
    this.render();
    
  }

  /**
   * 初始化渲染器
   */
  initRender() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      context: this.context
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor('rgb(255,255,255)', 0.9);
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;
    this.renderer.setPixelRatio(this.devicePixelRatio);
  }

  /**
   * 初始化相机
   */
  initCamera() {
    // this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1500);
    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 1, 10000 );
    this.camera.position.set(2, 2, 2);
    this.camera.up.set(0, 1, 0);//正方向
    this.camera.lookAt(this.viewCenter);

    //轨道视角控制器
    // this.orbitController = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // this.orbitController.enableZoom = false;
    // this.orbitController.rotateSpeed = 2;
    // this.orbitController.target = this.viewCenter;//设置控制点
  }

  /**
   * 初始化光线
   */
  initScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * 初始化光线
   */
  initLight() {
    this.light = new THREE.AmbientLight(0xfefefe);
    this.scene.add(this.light);
  }

  /**
   * 初始化物体
   */
  initObject() {
    this.rubik = new BasicRubik(this);
    this.rubik.model();
  }

  /**
   * 初始化事件
   */
  initEvent() {
    wx.onTouchStart(this.touchStart.bind(this));
    wx.onTouchMove(this.touchMove.bind(this));
    wx.onTouchEnd(this.touchEnd.bind(this));
  } 
  /**
   * 渲染
   */
  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this), canvas);
  }
    /**
   * 触摸开始
   */
  touchStart(event){
    var touch = event.touches[0];
    this.startPoint = touch;
    this.getIntersects(event);
    if (!this.isRotating && this.intersect) {//触摸点在魔方上且魔方没有转动
      this.startPoint = this.intersect.point;//开始转动，设置起始点
    }
    if (!this.isRotating && !this.intersect) {//触摸点没在魔方上
      this.startPoint = new THREE.Vector2(touch.clientX, touch.clientY);
   }
  }

  /**
   * 触摸移动
   */
  touchMove(event){
    var touch = event.touches[0];
      this.getIntersects(event);
      if (!this.isRotating && this.startPoint && this.intersect) {//滑动点在魔方上且魔方没有转动
        this.movePoint = this.intersect.point;
        if (!this.movePoint.equals(this.startPoint)) {//触摸点和滑动点不一样则意味着可以得到滑动方向
          this.rotateRubik();
          
        }
      }
      if (!this.isRotating && this.startPoint && !this.intersect) {//触摸点没在魔方上
        this.movePoint = new THREE.Vector2(touch.clientX, touch.clientY);
        if (!this.movePoint.equals(this.startPoint)) {
          this.rotateView();
        }
      }
  }

  /**
   * 触摸结束
   */
  touchEnd(){
    
  }
    /**
   * 获取操作魔方时的触摸点坐标以及该触摸点所在平面的法向量
   */
  getIntersects(event) {
    var touch = event.touches[0];
    var mouse = new THREE.Vector2();
    mouse.x = (touch.clientX / this.width) * 2 - 1;
    mouse.y = -(touch.clientY / this.height) * 2 + 1;
    this.raycaster.setFromCamera(mouse, this.camera);
    var rubikTypeName;
    var targetIntersect = [];
    for (var i = 1; i < this.scene.children.length; i++) {
      targetIntersect.push(this.scene.children[i]);
    }
    if (targetIntersect) {
      var intersects = this.raycaster.intersectObjects(targetIntersect,true);
      this.intersect = intersects[0];
      // this.normalize = intersects[0].face.normal;
    }
  }
    /**
   * 转动视图
   */
  rotateView() {
      var self = this;
      this.isRotating = true;//转动标识置为true
      //计算整体转动方向
      var direction = this.getViewDirection(this.startPoint, this.movePoint);
      this.rubik.rotateMoveWhole(direction,function () {
        self.resetRotateParams();
      });
  }
    /**
   * 获得视图转动方向
   */
  getViewDirection(startPoint, movePoint) {
    var direction;
    var rad = 30 * Math.PI / 180;
    var lenX = movePoint.x - startPoint.x;
    var lenY = movePoint.y - startPoint.y;
      if (startPoint.x > window.innerWidth / 2) {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.1;
          } else {
            direction = 3.1;
          }
        } else {
          if (lenX > 0) {
            direction = 0.3;
          } else {
            direction = 1.3;
          }
        }
      } else {
        if (Math.abs(lenY) > Math.abs(lenX) * Math.tan(rad)) {
          if (lenY < 0) {
            direction = 2.4;
          } else {
            direction = 3.4;
          }
        } else {
          if (lenX > 0) {
            direction = 4.4;
          } else {
            direction = 5.4;
          }
        }
      }
    return direction;
  }
  resetRotateParams() {
    this.isRotating = false;
    this.intersect = null;
    this.startPoint = null;
    this.movePoint = null;
  }

  /**
   * 魔方层转动
   */
  rotateRubik(){
    var self = this;
    this.isRotating = true;//转动标识置为true
    var direction = this.getViewDirection(this.startPoint, this.movePoint);
    this.rubik.rotateLayer(this.intersect,direction,function () {
       self.resetRotateParams();
    });
  }
}