<template>
  <div class="annotation-2d">
    <h2>2D标注任务</h2>
    
    <div class="content-container">
      <a-row :gutter="16">
        <a-col :span="16">
          <a-card title="标注区域" :bordered="true">
            <div class="annotation-area">
              <!-- 图片上传区域 -->
              <div v-if="!imageUrl" class="upload-container">
                <a-upload
                  name="file"
                  list-type="picture-card"
                  class="image-uploader"
                  :show-upload-list="false"
                  :before-upload="beforeUpload"
                  @change="handleImageChange"
                >
                  <div v-if="loading">
                    <a-icon type="loading" />
                  </div>
                  <div v-else>
                    <a-icon type="plus" />
                    <div class="ant-upload-text">上传图片</div>
                  </div>
                </a-upload>
              </div>
              
              <!-- 标注画布区域 -->
              <div v-else class="annotation-canvas-container">
                <div class="canvas-tools">
                  <a-radio-group v-model="currentTool" button-style="solid">
                    <a-radio-button value="rectangle">
                      <a-icon type="border" /> 矩形
                    </a-radio-button>
                    <a-radio-button value="select">
                      <a-icon type="select" /> 选择
                    </a-radio-button>
                    <a-radio-button value="delete" :disabled="!selectedBoxIndex">
                      <a-icon type="delete" /> 删除
                    </a-radio-button>
                  </a-radio-group>
                  
                  <a-button 
                    type="primary" 
                    style="margin-left: 16px;"
                    @click="clearCanvas"
                  >
                    <a-icon type="delete" /> 清空标注
                  </a-button>
                  
                  <a-button 
                    type="danger" 
                    style="margin-left: 8px;"
                    @click="removeImage"
                  >
                    <a-icon type="close-circle" /> 移除图片
                  </a-button>
                </div>
                
                <div class="canvas-wrapper" ref="canvasWrapper">
                  <canvas 
                    ref="annotationCanvas" 
                    @mousedown="handleMouseDown"
                    @mousemove="handleMouseMove"
                    @mouseup="handleMouseUp"
                    @mouseleave="handleMouseLeave"
                  ></canvas>
                  <img 
                    ref="annotationImage" 
                    :src="imageUrl" 
                    style="display: none;"
                    @load="initCanvas"
                  />
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="8">
          <a-card title="标注信息" :bordered="true">
            <div v-if="imageUrl">
              <div class="info-section">
                <h3>当前图片</h3>
                <p>尺寸: {{ imageWidth }} x {{ imageHeight }} 像素</p>
                <p>标注数量: {{ annotationBoxes.length }}</p>
              </div>
              
              <a-divider />
              
              <div class="info-section">
                <h3>标注列表</h3>
                <a-empty v-if="annotationBoxes.length === 0" description="暂无标注" />
                <a-list v-else size="small" bordered>
                  <a-list-item 
                    v-for="(box, index) in annotationBoxes" 
                    :key="index"
                    :class="{ 'selected-item': selectedBoxIndex === index }"
                    @click="selectBox(index)"
                  >
                    <div>
                      <div class="box-label">
                        <a-tag :color="box.color">{{ box.label || '未命名' }}</a-tag>
                      </div>
                      <div class="box-info">
                        位置: [{{ Math.round(box.x) }}, {{ Math.round(box.y) }}]
                      </div>
                      <div class="box-info">
                        尺寸: {{ Math.round(box.width) }} x {{ Math.round(box.height) }}
                      </div>
                    </div>
                  </a-list-item>
                </a-list>
                
                <a-button 
                  type="primary" 
                  style="margin-top: 10px; width: 100%;" 
                  icon="code" 
                  @click="printAnnotationData"
                >
                  打印标注数据到控制台
                </a-button>
              </div>
              
              <a-divider />
              
              <div class="info-section" v-if="selectedBoxIndex !== null">
                <h3>标签设置</h3>
                <a-form layout="vertical">
                  <a-form-item label="标签名称">
                    <a-input 
                      v-model="annotationBoxes[selectedBoxIndex].label"
                      placeholder="请输入标签名称"
                      @change="redrawCanvas"
                    />
                  </a-form-item>
                  <a-form-item label="标签颜色">
                    <a-select 
                      v-model="annotationBoxes[selectedBoxIndex].color" 
                      style="width: 100%"
                      @change="redrawCanvas"
                    >
                      <a-select-option value="blue">蓝色</a-select-option>
                      <a-select-option value="red">红色</a-select-option>
                      <a-select-option value="green">绿色</a-select-option>
                      <a-select-option value="orange">橙色</a-select-option>
                      <a-select-option value="purple">紫色</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-form>
              </div>
            </div>
            <a-empty v-else description="请先上传图片" />
          </a-card>
        </a-col>
      </a-row>
      
      <a-row style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="操作说明" :bordered="true">
            <a-steps direction="vertical" size="small" :current="999">
              <a-step title="上传图片" description="点击上传按钮选择要标注的图片" />
              <a-step title="选择工具" description="选择矩形工具进行框选标注" />
              <a-step title="绘制标注" description="在图片上按住鼠标左键拖动，绘制标注框" />
              <a-step title="编辑标注" description="点击标注列表中的项目，可以编辑标签名称和颜色" />
              <a-step title="删除标注" description="选择标注后，点击删除按钮或使用删除工具" />
            </a-steps>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Annotation2D',
  data() {
    return {
      imageUrl: '',
      loading: false,
      canvas: null,
      ctx: null,
      imageWidth: 0,
      imageHeight: 0,
      annotationBoxes: [],
      currentTool: 'rectangle',
      isDrawing: false,
      startX: 0,
      startY: 0,
      selectedBoxIndex: null,
      drawingBox: null,
      isDragging: false
    }
  },
  methods: {
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        this.$message.error('图片必须小于5MB!');
        return false;
      }
      return false; // 不上传到服务器，在前端处理
    },
    handleImageChange(info) {
      if (info.file) {
        this.loading = true;
        // 读取文件并转换为base64
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imageUrl = e.target.result;
          this.loading = false;
        };
        reader.readAsDataURL(info.file);
      }
    },
    initCanvas() {
      const img = this.$refs.annotationImage;
      const canvasWrapper = this.$refs.canvasWrapper;
      
      // 调整 canvas 尺寸以适应图片
      this.imageWidth = img.naturalWidth;
      this.imageHeight = img.naturalHeight;
      
      // 限制最大显示尺寸
      const maxWidth = canvasWrapper.clientWidth;
      const maxHeight = 500;
      
      let displayWidth = this.imageWidth;
      let displayHeight = this.imageHeight;
      
      if (displayWidth > maxWidth) {
        const ratio = maxWidth / displayWidth;
        displayWidth = maxWidth;
        displayHeight = displayHeight * ratio;
      }
      
      if (displayHeight > maxHeight) {
        const ratio = maxHeight / displayHeight;
        displayHeight = maxHeight;
        displayWidth = displayWidth * ratio;
      }
      
      const canvas = this.$refs.annotationCanvas;
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      
      this.redrawCanvas();
    },
    redrawCanvas() {
      if (!this.canvas || !this.ctx) return;
      
      const ctx = this.ctx;
      const img = this.$refs.annotationImage;
      
      // 清除画布
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      
      // 绘制所有标注框
      this.annotationBoxes.forEach((box, index) => {
        ctx.strokeStyle = box.color || 'blue';
        ctx.lineWidth = index === this.selectedBoxIndex ? 3 : 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // 绘制标签文本
        if (box.label) {
          ctx.fillStyle = box.color || 'blue';
          ctx.fillRect(box.x, box.y - 20, ctx.measureText(box.label).width + 10, 20);
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(box.label, box.x + 5, box.y - 5);
        }
      });
      
      // 绘制正在绘制的框
      if (this.isDrawing && this.drawingBox) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          this.drawingBox.x, 
          this.drawingBox.y, 
          this.drawingBox.width, 
          this.drawingBox.height
        );
      }
    },
    handleMouseDown(e) {
      if (!this.canvas) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.currentTool === 'rectangle') {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
        this.drawingBox = { x, y, width: 0, height: 0 };
      } else if (this.currentTool === 'select') {
        // 检查点击是否在现有框上
        let found = false;
        for (let i = this.annotationBoxes.length - 1; i >= 0; i--) {
          const box = this.annotationBoxes[i];
          if (
            x >= box.x && 
            x <= box.x + box.width && 
            y >= box.y && 
            y <= box.y + box.height
          ) {
            this.selectedBoxIndex = i;
            found = true;
            break;
          }
        }
        
        if (!found) {
          this.selectedBoxIndex = null;
        }
        
        this.redrawCanvas();
      } else if (this.currentTool === 'delete' && this.selectedBoxIndex !== null) {
        this.annotationBoxes.splice(this.selectedBoxIndex, 1);
        this.selectedBoxIndex = null;
        this.redrawCanvas();
      }
    },
    handleMouseMove(e) {
      if (!this.isDrawing || !this.canvas) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.currentTool === 'rectangle') {
        this.drawingBox.width = x - this.startX;
        this.drawingBox.height = y - this.startY;
        this.redrawCanvas();
      }
    },
    handleMouseUp(e) {
      if (!this.isDrawing || !this.canvas) return;
      
      if (this.currentTool === 'rectangle') {
        // 完成绘制矩形
        if (Math.abs(this.drawingBox.width) > 5 && Math.abs(this.drawingBox.height) > 5) {
          // 标准化坐标（如果宽度或高度为负）
          const newBox = {
            x: this.drawingBox.width < 0 ? this.startX + this.drawingBox.width : this.startX,
            y: this.drawingBox.height < 0 ? this.startY + this.drawingBox.height : this.startY,
            width: Math.abs(this.drawingBox.width),
            height: Math.abs(this.drawingBox.height),
            label: '未命名',
            color: 'blue'
          };
          
          this.annotationBoxes.push(newBox);
          this.selectedBoxIndex = this.annotationBoxes.length - 1;
        }
      }
      
      this.isDrawing = false;
      this.drawingBox = null;
      this.redrawCanvas();
    },
    handleMouseLeave() {
      this.handleMouseUp();
    },
    selectBox(index) {
      this.selectedBoxIndex = index;
      this.redrawCanvas();
    },
    clearCanvas() {
      this.$confirm({
        title: '确认清空标注？',
        content: '此操作将删除所有标注框，是否继续？',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.annotationBoxes = [];
          this.selectedBoxIndex = null;
          this.redrawCanvas();
          this.$message.success('已清空所有标注');
        }
      });
    },
    removeImage() {
      this.$confirm({
        title: '确认移除图片？',
        content: '此操作将移除当前图片和所有标注，是否继续？',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.imageUrl = '';
          this.annotationBoxes = [];
          this.selectedBoxIndex = null;
          this.$message.success('已移除图片');
        }
      });
    },
    printAnnotationData() {
      // 打印标注数据到控制台
      console.log('2D标注数据结构:');
      console.log(JSON.stringify(this.annotationBoxes, null, 2));
      
      // 统计信息
      const stats = {
        总标注数: this.annotationBoxes.length,
        标签统计: {}
      };
      
      this.annotationBoxes.forEach(box => {
        const label = box.label || '未命名';
        stats.标签统计[label] = (stats.标签统计[label] || 0) + 1;
      });
      
      console.log('标注统计信息:');
      console.log(stats);
      
      this.$message.success('标注数据已打印到控制台，请按F12查看');
    }
  }
}
</script>

<style scoped>
.annotation-2d {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}

.image-uploader {
  display: flex;
  justify-content: center;
}

.annotation-canvas-container {
  padding: 10px 0;
}

.canvas-tools {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.canvas-wrapper {
  position: relative;
  border: 1px solid #eee;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
}

canvas {
  display: block;
  cursor: crosshair;
}

.info-section {
  margin-bottom: 16px;
}

.info-section h3 {
  margin-bottom: 8px;
  font-weight: 500;
}

.box-label {
  margin-bottom: 5px;
}

.box-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.selected-item {
  background-color: #e6f7ff;
}
</style> 