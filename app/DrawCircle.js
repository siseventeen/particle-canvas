/**
 * 画圆的类
 * 使用ES6 Class语法
 */

class Circle {
  // 以一个圆为对象，设置随机的 x，y坐标，r半径，_mx，_my移动的距离
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = Math.random() * 14 + 1;
    this._mx = Math.random() * 2 - 1;
    this._my = Math.random() * 2 - 1;
  }

  // 画圆
  drawCircle(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 360);
    ctx.closePath();
    ctx.fillStyle = 'rgba(204, 204, 204, 0.2)';
    ctx.fill();
  }

  // 画线
  drawLine(ctx, _circle) {
    let dx = this.x - _circle.x;
    let dy = this.y - _circle.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    // 距离远的圆圈，不做连线处理
    if (d < 150) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);         // 起始点
      ctx.lineTo(_circle.x, _circle.y);    // 终点
      ctx.closePath();
      ctx.strokeStyle = 'rgba(204, 204, 204, 0.1)';
      ctx.stroke();
    }
  }

  // 圆移动
  move(w, h) {
    // 屏幕范围内
    this._mx = (this.x < w && this.x > 0) ? this._mx : ( -this._mx);
    this._my = (this.y < h && this.y > 0) ? this._my : ( -this._my);
    this.x += this._mx / 2;
    this.y += this._my / 2;
  }
}

// 鼠标当前位置画圆
class currentCircle extends Circle {
  constructor(x, y) {
    // 调用父类的constructor(x, y)
    super(x, y);
  }

  drawCircle(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, 360);
    ctx.closePath();
    ctx.fillStyle = `rgba(76, 132, 255, ${(parseInt(Math.random() * 100) / 100)})`;
    ctx.fill();
  }
}

export { Circle, currentCircle };