<template>
  <div class="annotation-3d">
    <h2>3D标注任务</h2>
    
    <div class="content-container">
      <a-row :gutter="16">
        <a-col :span="16">
          <a-card title="3D标注区域" :bordered="true">
            <div class="model-actions">
              <a-button-group>
                <a-button type="primary" @click="loadDemoModel">
                  <a-icon type="experiment" /> 加载演示模型
                </a-button>
                
                <a-dropdown :disabled="loading">
                  <a-menu slot="overlay">
                    <a-menu-item key="1">
                      <a-upload
                        :beforeUpload="handlePCDFileUpload"
                        :showUploadList="false"
                        accept=".pcd"
                      >
                        <span><a-icon type="upload" /> 上传PCD文件</span>
                      </a-upload>
                    </a-menu-item>
                    <a-menu-item key="2" @click="loadPCDFile">
                      <span><a-icon type="cloud-download" /> 加载示例PCD</span>
                    </a-menu-item>
                  </a-menu>
                  <a-button :loading="loading">
                    <a-icon type="cloud" /> 点云文件 <a-icon type="down" />
                  </a-button>
                </a-dropdown>
                
                <a-button :disabled="!modelLoaded" @click="resetCamera">
                  <a-icon type="reload" /> 重置视图
                </a-button>
              </a-button-group>
              
              <a-radio-group 
                v-model="currentTool" 
                button-style="solid" 
                style="margin-left: 16px"
                :disabled="!modelLoaded"
              >
                <a-radio-button value="navigate">
                  <a-icon type="global" /> 导航
                </a-radio-button>
                <a-radio-button value="addPoint">
                  <a-icon type="plus-circle" /> 添加标注点
                </a-radio-button>
                <a-radio-button value="select" :disabled="annotations.length === 0">
                  <a-icon type="select" /> 选择
                </a-radio-button>
              </a-radio-group>
            </div>
            
            <div 
              class="model-container" 
              ref="container"
              @dragover.prevent
              @dragenter.prevent="handleDragEnter"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              :class="{ 'drag-over': isDragging }"
            >
              <!-- Three.js 将在这里渲染 -->
              <div 
                v-if="!modelLoaded" 
                class="model-placeholder"
              >
                <a-empty description="请加载3D模型">
                  <a-button type="primary" @click="loadDemoModel">
                    加载演示模型
                  </a-button>
                </a-empty>
              </div>
              
              <!-- 添加拖放提示 -->
              <div v-if="isDragging" class="drag-overlay">
                <a-icon type="cloud-upload" style="font-size: 48px; color: #1890ff" />
                <p>释放鼠标上传PCD文件</p>
              </div>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="8">
          <a-card title="标注信息" :bordered="true">
            <div v-if="modelLoaded">
              <div class="info-section">
                <h3>当前模型</h3>
                <p>名称: {{ modelInfo.name || '未命名模型' }}</p>
                <p>顶点数: {{ modelInfo.vertices || 0 }}</p>
                <p>标注点数: {{ annotations.length }}</p>
              </div>
              
              <a-divider />
              
              <div class="info-section">
                <h3>标注列表</h3>
                <a-empty v-if="annotations.length === 0" description="暂无标注" />
                <a-list v-else size="small" bordered>
                  <a-list-item 
                    v-for="(annotation, index) in annotations" 
                    :key="index"
                    :class="{ 'selected-item': selectedAnnotationIndex === index }"
                    @click="selectAnnotation(index)"
                  >
                    <a-list-item-meta>
                      <template slot="title">
                        <a-tag :color="annotation.color">{{ annotation.label || '未命名点' }}</a-tag>
                      </template>
                      <template slot="description">
                        <div class="anno-info">
                          位置: [{{ formatCoord(annotation.position.x) }}, 
                                {{ formatCoord(annotation.position.y) }}, 
                                {{ formatCoord(annotation.position.z) }}]
                        </div>
                      </template>
                    </a-list-item-meta>
                    <a-button 
                      type="danger" 
                      size="small" 
                      shape="circle"
                      @click.stop="removeAnnotation(index)"
                    >
                      <a-icon type="delete" />
                    </a-button>
                  </a-list-item>
                </a-list>
                
                <a-button 
                  type="primary" 
                  style="margin-top: 10px; width: 100%;" 
                  icon="code" 
                  @click="printAnnotationData"
                  :disabled="annotations.length === 0"
                >
                  打印标注数据到控制台
                </a-button>
              </div>
              
              <a-divider />
              
              <div class="info-section" v-if="selectedAnnotationIndex !== null">
                <h3>标签设置</h3>
                <a-form layout="vertical">
                  <a-form-item label="标签名称">
                    <a-input 
                      v-model="annotations[selectedAnnotationIndex].label"
                      placeholder="请输入标签名称"
                      @change="updateAnnotation"
                    />
                  </a-form-item>
                  <a-form-item label="标签颜色">
                    <a-select 
                      v-model="annotations[selectedAnnotationIndex].color" 
                      style="width: 100%"
                      @change="updateAnnotation"
                    >
                      <a-select-option value="blue">蓝色</a-select-option>
                      <a-select-option value="red">红色</a-select-option>
                      <a-select-option value="green">绿色</a-select-option>
                      <a-select-option value="orange">橙色</a-select-option>
                      <a-select-option value="purple">紫色</a-select-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="描述">
                    <a-textarea
                      v-model="annotations[selectedAnnotationIndex].description"
                      placeholder="请输入描述信息"
                      :rows="3"
                      @change="updateAnnotation"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </div>
            <a-empty v-else description="请先加载3D模型" />
          </a-card>
        </a-col>
      </a-row>
      
      <a-row style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="操作说明" :bordered="true">
            <a-steps direction="vertical" size="small" :current="999">
              <a-step title="加载模型" description="点击加载演示模型按钮来加载一个3D模型" />
              <a-step title="浏览模型" description="使用导航工具，按住鼠标左键拖动旋转模型，滚轮缩放" />
              <a-step title="添加标注" description="选择添加标注点工具，点击模型表面添加标注点" />
              <a-step title="编辑标注" description="点击标注列表中的项目，可以编辑标签名称、颜色和描述" />
              <a-step title="删除标注" description="点击标注旁边的删除按钮可以删除标注" />
            </a-steps>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

export default {
  name: 'Annotation3D',
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      model: null,
      raycaster: null,
      mouse: null,
      
      modelLoaded: false,
      modelInfo: {
        name: '',
        vertices: 0
      },
      
      currentTool: 'navigate',
      annotations: [],
      selectedAnnotationIndex: null,
      
      animationId: null,
      loading: false,
      isDragging: false
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    this.cleanup();
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // Three.js 初始化
    initThree() {
      const container = this.$refs.container;
      
      // 创建场景
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf0f0f0);
      
      // 添加环境光和定向光
      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1).normalize();
      this.scene.add(directionalLight);
      
      // 创建相机
      this.camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
      );
      this.camera.position.z = 5;
      
      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);
      
      // 创建轨道控制器
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.screenSpacePanning = false;
      this.controls.maxPolarAngle = Math.PI / 2;
      
      // 创建射线投射器和鼠标向量
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      
      // 添加坐标轴辅助
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      
      // 添加网格地面
      const gridHelper = new THREE.GridHelper(10, 10);
      this.scene.add(gridHelper);
      
      // 添加点击事件监听
      this.renderer.domElement.addEventListener('click', this.handleClick);
      
      // 开始动画循环
      this.animate();
    },
    
    animate() {
      this.animationId = requestAnimationFrame(this.animate);
      
      if (this.controls) {
        this.controls.update();
      }
      
      this.renderer.render(this.scene, this.camera);
    },
    
    loadDemoModel() {
      if (!this.scene) {
        this.initThree();
      }
      
      // 先清除已有模型
      if (this.model) {
        this.scene.remove(this.model);
        this.model = null;
      }
      
      // 创建一个简单的立方体作为演示模型
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3080ff,
        metalness: 0.2,
        roughness: 0.5
      });
      
      this.model = new THREE.Mesh(geometry, material);
      this.scene.add(this.model);
      
      // 更新模型信息
      this.modelInfo = {
        name: '立方体演示模型',
        vertices: geometry.attributes.position.count
      };
      
      this.modelLoaded = true;
      this.resetCamera();
    },
    
    handleClick(event) {
      if (!this.modelLoaded || this.currentTool === 'navigate') return;
      
      // 计算鼠标位置的标准化设备坐标
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 从相机和鼠标位置更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      if (this.currentTool === 'addPoint') {
        // 检测射线与模型的交点
        const intersects = this.raycaster.intersectObject(this.model);
        
        if (intersects.length > 0) {
          this.addAnnotationPoint(intersects[0].point);
        }
      } else if (this.currentTool === 'select') {
        // 创建一个临时数组，包含标注点的三维物体
        const annotationObjects = this.annotations.map(anno => anno.marker);
        
        // 检测射线与标注点的交点
        const intersects = this.raycaster.intersectObjects(annotationObjects);
        
        if (intersects.length > 0) {
          // 找到被点击的标注点的索引
          const markerIndex = annotationObjects.indexOf(intersects[0].object);
          if (markerIndex !== -1) {
            this.selectAnnotation(markerIndex);
          }
        } else {
          this.selectedAnnotationIndex = null;
        }
      }
    },
    
    addAnnotationPoint(position) {
      // 创建一个小球体表示标注点
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x0066ff });
      const marker = new THREE.Mesh(geometry, material);
      
      // 设置标注点位置
      marker.position.copy(position);
      
      // 将标注点添加到场景
      this.scene.add(marker);
      
      // 创建标注数据
      const annotation = {
        position: position.clone(),
        label: `点 ${this.annotations.length + 1}`,
        color: 'blue',
        description: '',
        marker: marker
      };
      
      // 添加到标注列表
      this.annotations.push(annotation);
      this.selectedAnnotationIndex = this.annotations.length - 1;
    },
    
    selectAnnotation(index) {
      this.selectedAnnotationIndex = index;
      
      // 高亮显示选中的标注点
      this.annotations.forEach((anno, i) => {
        if (i === index) {
          anno.marker.material.color.set(this.getColorHex(anno.color));
          anno.marker.material.opacity = 1;
          anno.marker.scale.set(1.5, 1.5, 1.5);
        } else {
          anno.marker.material.color.set(this.getColorHex(anno.color));
          anno.marker.material.opacity = 0.7;
          anno.marker.scale.set(1, 1, 1);
        }
      });
    },
    
    removeAnnotation(index) {
      // 从场景中移除标注点
      this.scene.remove(this.annotations[index].marker);
      
      // 从列表中移除标注
      this.annotations.splice(index, 1);
      
      // 更新选中状态
      if (this.selectedAnnotationIndex === index) {
        this.selectedAnnotationIndex = null;
      } else if (this.selectedAnnotationIndex > index) {
        this.selectedAnnotationIndex--;
      }
    },
    
    updateAnnotation() {
      if (this.selectedAnnotationIndex === null) return;
      
      const annotation = this.annotations[this.selectedAnnotationIndex];
      
      // 更新标注点颜色
      annotation.marker.material.color.set(this.getColorHex(annotation.color));
    },
    
    resetCamera() {
      if (!this.camera || !this.controls) return;
      
      this.camera.position.set(0, 3, 5);
      this.camera.lookAt(0, 0, 0);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    },
    
    handleResize() {
      if (!this.camera || !this.renderer || !this.$refs.container) return;
      
      const container = this.$refs.container;
      
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    },
    
    cleanup() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      
      if (this.renderer) {
        this.renderer.domElement.removeEventListener('click', this.handleClick);
        this.$refs.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
      }
      
      // 清除场景中的所有对象
      if (this.scene) {
        this.scene.clear();
      }
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.model = null;
    },
    
    formatCoord(value) {
      return value.toFixed(2);
    },
    
    getColorHex(colorName) {
      const colorMap = {
        'blue': 0x1890ff,
        'red': 0xff4d4f,
        'green': 0x52c41a,
        'orange': 0xfa8c16,
        'purple': 0x722ed1
      };
      
      return colorMap[colorName] || 0x1890ff;
    },
    
    printAnnotationData() {
      // 创建可以序列化的标注数据
      const serializableAnnotations = this.annotations.map(anno => ({
        label: anno.label,
        color: anno.color,
        description: anno.description,
        position: {
          x: anno.position.x,
          y: anno.position.y,
          z: anno.position.z
        }
      }));
      
      // 打印标注数据到控制台
      console.log('3D标注数据结构:');
      console.log(JSON.stringify(serializableAnnotations, null, 2));
      
      // 统计信息
      const stats = {
        总标注数: this.annotations.length,
        标签统计: {}
      };
      
      this.annotations.forEach(annotation => {
        const label = annotation.label || '未命名点';
        stats.标签统计[label] = (stats.标签统计[label] || 0) + 1;
      });
      
      console.log('标注统计信息:');
      console.log(stats);
      
      this.$message.success('3D标注数据已打印到控制台，请按F12查看');
    },
    
    // 添加加载PCD文件的方法
    handlePCDFileUpload(file) {
      // 检查文件类型
      if (file.type !== '' && !file.name.endsWith('.pcd')) {
        this.$message.error('只支持PCD格式的点云文件!');
        return false;
      }
      
      // 显示加载中状态
      this.loading = true;
      
      // 创建文件读取器
      const reader = new FileReader();
      reader.onload = (e) => {
        // 创建PCDLoader
        const loader = new PCDLoader();
        
        try {
          // 检查文件内容是否有效
          if (!e.target.result) {
            throw new Error('文件内容为空');
          }
          
          // 使用PCDLoader加载方法而非parse方法
          // 我们需要通过Blob和URL创建一个可以被loader加载的URL
          const blob = new Blob([e.target.result], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          
          loader.load(
            url,
            (points) => {
              // 清理URL
              URL.revokeObjectURL(url);
              
              // 移除之前的模型（如果有）
              if (this.model) {
                this.scene.remove(this.model);
              }
              
              // 添加点云到场景
              this.scene.add(points);
              this.model = points;
              
              // 重置相机视角
              this.resetCamera();
              
              this.modelLoaded = true;
              this.modelInfo = {
                name: file.name,
                vertices: points.geometry.attributes.position ? points.geometry.attributes.position.count : 0,
                type: 'PCD点云'
              };
              
              this.$message.success('点云文件加载成功');
              this.loading = false;
            },
            (xhr) => {
              // 进度回调
              console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
              // 错误回调
              console.error('点云文件加载失败:', error);
              this.$message.error('点云文件加载失败: ' + error.message);
              this.loading = false;
              URL.revokeObjectURL(url);
            }
          );
        } catch (error) {
          console.error('点云文件处理失败:', error);
          this.$message.error('点云文件处理失败: ' + error.message);
          this.loading = false;
        }
      };
      
      reader.onerror = (event) => {
        console.error('文件读取失败:', event);
        this.$message.error('文件读取失败');
        this.loading = false;
      };
      
      // 以ArrayBuffer方式读取文件
      reader.readAsArrayBuffer(file);
      
      return false; // 阻止默认上传行为
    },
    
    loadPCDFile() {
      this.loading = true;
      this.$message.loading({ content: '正在加载示例点云文件...', key: 'pcdLoading', duration: 0 });
      
      // 初始化Three.js（如果还没初始化）
      if (!this.scene) {
        this.initThree();
      }
      
      // 创建PCDLoader
      const loader = new PCDLoader();
      
      // 加载public目录下的PCD文件
      loader.load(
        '/pcd/23507.361176.pcd', // 相对于public目录的路径
        (points) => {
          // 移除之前的模型（如果有）
          if (this.model) {
            this.scene.remove(this.model);
          }
          
          // 添加点云到场景
          this.scene.add(points);
          this.model = points;
          
          // 重置相机视角
          this.resetCamera();
          
          this.modelLoaded = true;
          this.modelInfo = {
            name: '23507.361176.pcd',
            vertices: points.geometry.attributes.position ? points.geometry.attributes.position.count : 0,
            type: 'PCD点云'
          };
          
          this.loading = false;
          this.$message.success({ content: 'PCB点云加载成功', key: 'pcdLoading' });
        },
        (xhr) => {
          // 加载进度回调
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.$message.loading({ content: `正在加载示例点云文件... ${percent}%`, key: 'pcdLoading', duration: 0 });
        },
        (error) => {
          // 错误回调
          console.error('点云加载失败:', error);
          this.$message.error({ content: '点云加载失败: ' + error.message, key: 'pcdLoading' });
          this.loading = false;
        }
      );
    },
    
    handleDragEnter() {
      this.isDragging = true;
    },
    
    handleDragLeave() {
      this.isDragging = false;
    },
    
    handleDrop(event) {
      this.isDragging = false;
      const files = event.dataTransfer.files;
      if (files.length) {
        const file = files[0];
        if (file.name.endsWith('.pcd')) {
          this.handlePCDFileUpload(file);
        } else {
          this.$message.error('只支持PCD格式的点云文件!');
        }
      }
    }
  }
}
</script>

<style scoped>
.annotation-3d {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.model-actions {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.model-container {
  position: relative;
  height: 500px;
  background-color: #f0f0f0;
  border: 1px solid #eee;
  overflow: hidden;
  transition: border-color 0.3s;
}

.model-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

.info-section {
  margin-bottom: 16px;
}

.info-section h3 {
  margin-bottom: 8px;
  font-weight: 500;
}

.anno-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.selected-item {
  background-color: #e6f7ff;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.drag-overlay p {
  margin-top: 16px;
  font-size: 16px;
  color: #1890ff;
}

.drag-over {
  border: 2px dashed #1890ff;
  background-color: rgba(24, 144, 255, 0.05);
}
</style> 