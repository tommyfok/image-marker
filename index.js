new Vue({
    el: 'body',
    data: {
        isDown: false,
        isDragging: false,
        rectIndex: -1,
        rects: [],
        draggingRect: null,
        mousepos: [],
        imageUrl: 'https://tommyfok.github.io/image-marker/car.jpg',
        inputImageUrl: 'https://tommyfok.github.io/image-marker/car.jpg',
        imageInfo: {
            width: 0,
            height: 0
        }
    },
    ready: function () {
        this.setImgUrl();
    },
    methods: {
        clear: function () {
            this.$set('rects', []);
        },
        getResult: function () {
            var outRects = [];
            var widthRatio = this.imageInfo.width / 640;
            var heightRatio = this.imageInfo.height / 480;
            this.rects.forEach(function (rect) {
                outRects.push({
                    left: Math.min(rect.start[0], rect.end[0]) * widthRatio,
                    top: Math.min(rect.start[1], rect.end[1]) * heightRatio,
                    width: Math.abs(rect.end[0] - rect.start[0]) * widthRatio,
                    height: Math.abs(rect.end[1] - rect.start[1]) * heightRatio
                });
            });
            console.log(JSON.stringify(outRects));
            return outRects;
        },
        setImgUrl: function () {
            this.imageUrl = this.inputImageUrl;
            this.getImgInfo(this.imageUrl);
        },
        getImgInfo: function (url, callback) {
            var self = this;
            var callback = typeof callback === 'function' ? callback : function () {};
            var img = document.createElement('img');
            var container = document.getElementById('imgLoader');
            if (!container) {
                container = document.createElement('div');
                container.id = 'imgLoader';
                document.body.appendChild(container);
            }
            img.onload = function () {
                self.imageInfo.width = img.width;
                self.imageInfo.height = img.height;
                callback(img);
                console.log('load ' + url + ' successed');
            };
            img.onerror = function () {
                callback.apply(self, arguments);
                console.log('load ' + url + ' failed');
            };
            img.src = url;
            container.appendChild(img);
        },
        getPreviewBg: function (width, height) {
            return {
                'background-image': 'url(' + this.imageUrl + ')',
                'background-position': (width / 2) - (this.mousepos[0] / 640) * this.imageInfo.width + 'px ' + ((height / 2) - (this.mousepos[1] / 480) * this.imageInfo.height) + 'px',
                width: width + 'px',
                height: height + 'px'
            };
        },
        copy: function (obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        inRect: function (pos, rect) {
            var xStart = Math.min(rect.start[0], rect.end[0]);
            var xEnd = Math.max(rect.start[0], rect.end[0]);
            var yStart = Math.min(rect.start[1], rect.end[1]);
            var yEnd = Math.max(rect.start[1], rect.end[1]);
            return (pos[0] >= xStart) &&
                   (pos[0] <= xEnd) &&
                   (pos[1] >= yStart) &&
                   (pos[1] <= yEnd);
        },
        hitRects: function (pos) {
            var self = this;
            var outRects = [];
            self.rects.forEach(function (rect) {
                if (rect.end && (typeof rect.end[0] === 'number') && self.inRect(pos, rect)) {
                    outRects.push(rect);
                }
            });
            return outRects;
        },
        getRectStyle: function (rect) {
            var obj
            if (rect.end) {
                obj = {
                    left: Math.min(rect.start[0], rect.end[0]) + 'px',
                    top: Math.min(rect.start[1], rect.end[1]) + 'px',
                    width: Math.abs(rect.end[0] - rect.start[0]) + 'px',
                    height: Math.abs(rect.end[1] - rect.start[1]) + 'px'
                };
            } else {
                obj = {
                    left: rect.start[0] + 'px',
                    top: rect.start[1] + 'px',
                    width: '1px',
                    height: '1px'
                };
            }
            return obj;
        },
        mousedown: function (e) {
            var pos = [e.offsetX, e.offsetY];
            var currentRect = this.rectIndex > -1 ? this.rects[this.rectIndex] : undefined;
            var hitRects = this.hitRects(pos);
            var topRect = hitRects[hitRects.length - 1];
            if (e.button === 0) {
                if (currentRect && !currentRect.end) {
                    currentRect.end = pos;
                    this.rectIndex = -1;
                } else {
                    if (hitRects.length > 0) {
                        this.$set('draggingRect', topRect);
                        this.draggingRect.isDragging = true;
                        this.draggingRect.dragStart.start = this.copy(this.draggingRect.start);
                        this.draggingRect.dragStart.end = this.copy(this.draggingRect.end);
                        this.draggingRect.dragStart.mouse = pos;
                    } else {
                        currentRect = {
                            isDragging: false,
                            start: pos,
                            dragStart: {
                                start: undefined,
                                end: undefined,
                                mouse: undefined
                            },
                            end: undefined //一定要有这个属性之后赋值才会被检测到
                        };
                        this.rects.push(currentRect);
                        this.rectIndex = this.rects.indexOf(currentRect);
                    }
                }
                this.isDown = true;
            } else if (topRect && (e.button === 2)) {
                e.preventDefault();
                e.stopPropagation();
                this.rects.splice(this.rects.indexOf(topRect), 1);
            }
        },
        mouseup: function () {
            if (this.isDown && this.isDragging) {
                this.rectIndex = -1;
            }
            this.isDown = false;
            this.isDragging = false;
            this.draggingRect && (this.draggingRect.isDragging = false);
        },
        mousemove: function (e) {
            var pos = [e.offsetX, e.offsetY];
            var currentRect = this.rectIndex > -1 ? this.rects[this.rectIndex] : undefined;
            this.mousepos = pos;
            if (this.isDown && currentRect) {
                currentRect.end = pos;
                this.isDragging = true;
            }
            if (this.draggingRect && this.draggingRect.isDragging) {
                var dr = this.draggingRect;
                var drds = this.draggingRect.dragStart;
                dr.start = [drds.start[0] + pos[0] - drds.mouse[0], drds.start[1] + pos[1] - drds.mouse[1]];
                dr.end = [drds.end[0] + pos[0] - drds.mouse[0], drds.end[1] + pos[1] - drds.mouse[1]];
            }
        }
    }
});
