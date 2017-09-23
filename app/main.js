'use strict';
import {Circle, currentCircle} from './DrawCircle';

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");
// 画布宽高
let w = canvas.width = canvas.offsetWidth;
let h = canvas.height = canvas.offsetHeight;
// 保存圆的数组，使用Circle类创建
let circles = [];
let current_circle = new currentCircle(0, 0);

let draw = function () {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < circles.length; i++) {
    circles[i].move(w, h);
    circles[i].drawCircle(ctx);
    for (let j = i + 1; j < circles.length; j++) {
      circles[i].drawLine(ctx, circles[j]);
    }
  }
  if (current_circle.x) {
    current_circle.drawCircle(ctx);
    for (let k = 1; k < circles.length; k++) {
      // 绘制鼠标与临近点连线
      current_circle.drawLine(ctx, circles[k]);
    }
  }
  requestAnimationFrame(draw);
};

// 初始化圆的个数
let init = function (num) {
  for (let i = 0; i < num; i++) {
    circles.push(new Circle(Math.random() * w, Math.random() * h));
  }
  draw();
};

window.addEventListener('load', init(80));
window.addEventListener('mousemove', function (e) {
  e = e || window.event;
  current_circle.x = e.clientX;
  current_circle.y = e.clientY;
});
window.addEventListener('mouseout', function (e) {
  current_circle.x = null;
  current_circle.y = null;
});
