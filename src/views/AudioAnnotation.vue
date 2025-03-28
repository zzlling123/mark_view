<template>
  <div class="audio-annotation">
    <h2>音频标注任务</h2>
    
    <div class="content-container">
      <a-row :gutter="16">
        <a-col :span="24">
          <a-card title="音频标注区域" :bordered="true">
            <div class="audio-actions">
              <a-upload
                name="file"
                :show-upload-list="false"
                :before-upload="beforeAudioUpload"
                @change="handleAudioChange"
              >
                <a-button :disabled="audioLoading">
                  <a-icon type="upload" /> 上传音频文件
                </a-button>
              </a-upload>
              
              <div class="play-controls" v-if="audioLoaded">
                <a-button-group>
                  <a-button @click="playAudio">
                    <a-icon :type="isPlaying ? 'pause-circle' : 'play-circle'" />
                    {{ isPlaying ? '暂停' : '播放' }}
                  </a-button>
                  <a-button @click="stopAudio">
                    <a-icon type="stop" /> 停止
                  </a-button>
                </a-button-group>
                
                <a-radio-group 
                  v-model="currentTool" 
                  button-style="solid" 
                  style="margin-left: 16px"
                >
                  <a-radio-button value="navigate">
                    <a-icon type="drag" /> 导航
                  </a-radio-button>
                  <a-radio-button value="addMarker">
                    <a-icon type="plus-circle" /> 添加标记点
                  </a-radio-button>
                  <a-radio-button value="addRegion">
                    <a-icon type="scissor" /> 选择片段
                  </a-radio-button>
                </a-radio-group>
                
                <span class="time-display" v-if="audioLoaded">
                  {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </span>
              </div>
            </div>
            
            <div class="audio-container">
              <div class="waveform-container" ref="waveformContainer">
                <!-- wavesurfer.js 将在这里渲染波形 -->
              </div>
              
              <div class="markers-container" ref="markersContainer">
                <!-- 标注标记将在这里显示 -->
                <div 
                  v-for="(marker, index) in markers" 
                  :key="'marker-'+index"
                  class="marker"
                  :class="{ 'selected': selectedMarkerIndex === index }"
                  :style="{ left: `${marker.position * 100}%` }"
                  @click.stop="selectMarker(index)"
                >
                  <div class="marker-line"></div>
                  <div class="marker-label">{{ marker.label }}</div>
                </div>
              </div>
              
              <div v-if="!audioLoaded" class="upload-placeholder">
                <a-empty description="请上传音频文件">
                  <a-upload
                    name="file"
                    :show-upload-list="false"
                    :before-upload="beforeAudioUpload"
                    @change="handleAudioChange"
                  >
                    <a-button type="primary">
                      <a-icon type="upload" /> 上传音频文件
                    </a-button>
                  </a-upload>
                </a-empty>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
      
      <!-- 添加新的区域标注列表 -->
      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="音频片段标注" :bordered="true">
            <a-empty v-if="regions.length === 0" description="暂无片段标注">
              <template #description>
                <p>使用"选择片段"工具，在波形上拖动来创建音频片段标注</p>
              </template>
            </a-empty>
            <a-table
              v-else
              :columns="regionColumns"
              :data-source="regionTableData"
              :pagination="false"
              :row-class-name="getRegionRowClassName"
              @row-click="onRegionRowClick"
            >
              <template slot="action" slot-scope="text, record, index">
                <a-button 
                  type="link" 
                  size="small" 
                  @click.stop="() => removeRegion(record.id)" 
                  style="color: #ff4d4f"
                >删除</a-button>
                <a-button 
                  type="link" 
                  size="small" 
                  @click.stop="() => playRegion(record.id)"
                >播放</a-button>
              </template>
              <template slot="time" slot-scope="text, record">
                {{ formatTime(record.start) }} - {{ formatTime(record.end) }}
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
      
      <!-- 点标注和片段标注信息 -->
      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="12">
          <a-card title="标注列表" :bordered="true">
            <a-empty v-if="markers.length === 0" description="暂无标注" />
            <a-table
              v-else
              :columns="markerColumns"
              :data-source="markerTableData"
              :pagination="false"
              :row-class-name="getRowClassName"
              @row-click="onRowClick"
            >
              <template slot="action" slot-scope="text, record, index">
                <a-button 
                  type="link" 
                  size="small" 
                  @click.stop="() => removeMarker(index)" 
                  style="color: #ff4d4f"
                >删除</a-button>
                <a-button 
                  type="link" 
                  size="small" 
                  @click.stop="() => seekToMarker(index)"
                >定位</a-button>
              </template>
            </a-table>
          </a-card>
        </a-col>
        
        <a-col :span="12">
          <!-- 标注详情，根据所选类型显示不同内容 -->
          <a-card :title="detailTitle" :bordered="true">
            <!-- 显示点标注的详细信息 -->
            <div v-if="selectedType === 'marker' && selectedMarkerIndex !== null">
              <a-form layout="vertical">
                <a-form-item label="时间点">
                  <a-input-number
                    v-model="markers[selectedMarkerIndex].time"
                    :min="0"
                    :max="duration"
                    :precision="2"
                    style="width: 100%"
                    @change="updateMarkerTime"
                  />
                </a-form-item>
                <a-form-item label="标签">
                  <a-input 
                    v-model="markers[selectedMarkerIndex].label" 
                    placeholder="请输入标签名称"
                  />
                </a-form-item>
                <a-form-item label="标签类型">
                  <a-select 
                    v-model="markers[selectedMarkerIndex].type" 
                    style="width: 100%"
                  >
                    <a-select-option value="speech">语音</a-select-option>
                    <a-select-option value="music">音乐</a-select-option>
                    <a-select-option value="noise">噪音</a-select-option>
                    <a-select-option value="other">其他</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="描述">
                  <a-textarea
                    v-model="markers[selectedMarkerIndex].description"
                    placeholder="请输入描述信息"
                    :rows="3"
                  />
                </a-form-item>
              </a-form>
            </div>
            
            <!-- 显示区域标注的详细信息 -->
            <div v-else-if="selectedType === 'region' && selectedRegion">
              <a-form layout="vertical">
                <a-form-item label="开始时间">
                  <a-input-number
                    v-model="selectedRegion.start"
                    :min="0"
                    :max="selectedRegion.end"
                    :precision="2"
                    style="width: 100%"
                    @change="updateRegionBoundary"
                  />
                </a-form-item>
                <a-form-item label="结束时间">
                  <a-input-number
                    v-model="selectedRegion.end"
                    :min="selectedRegion.start"
                    :max="duration"
                    :precision="2"
                    style="width: 100%"
                    @change="updateRegionBoundary"
                  />
                </a-form-item>
                <a-form-item label="标签">
                  <a-input 
                    v-model="selectedRegion.data.label" 
                    placeholder="片段标签"
                    @change="updateRegionData"
                  />
                </a-form-item>
                <a-form-item label="音频内容">
                  <a-textarea
                    v-model="selectedRegion.data.content"
                    placeholder="输入此音频片段中说了什么内容"
                    :rows="5"
                    @change="updateRegionData"
                  />
                </a-form-item>
              </a-form>
            </div>
            
            <!-- 没有选中项时显示空状态 -->
            <a-empty v-else description="请选择一个标注进行编辑" />
          </a-card>
        </a-col>
      </a-row>
      
      <a-row style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="操作说明" :bordered="true">
            <a-steps direction="vertical" size="small" :current="999">
              <a-step title="上传音频" description="点击上传按钮选择音频文件" />
              <a-step title="播放音频" description="使用播放控制按钮播放、暂停和停止音频" />
              <a-step title="添加标记点" description="选择添加标记点工具，点击波形位置添加时间点标注" />
              <a-step title="选择音频片段" description="选择选择片段工具，在波形上拖动来创建片段标注" />
              <a-step title="标注片段内容" description="选择片段后，在右侧输入框中标注该片段的音频内容" />
            </a-steps>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

export default {
  name: 'AudioAnnotation',
  data() {
    return {
      wavesurfer: null,
      audioLoaded: false,
      audioLoading: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      
      // 工具选择
      currentTool: 'navigate',
      
      // 标记点数据
      markers: [],
      selectedMarkerIndex: null,
      
      // 区域标注数据
      regions: [],
      selectedRegionId: null,
      
      // 当前选中的标注类型（marker或region）
      selectedType: null,
      
      // 标记点列表列定义
      markerColumns: [
        {
          title: '时间',
          dataIndex: 'time',
          key: 'time',
          sorter: (a, b) => a.rawTime - b.rawTime
        },
        {
          title: '标签',
          dataIndex: 'label',
          key: 'label'
        },
        {
          title: '类型',
          dataIndex: 'type',
          key: 'type'
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ],
      
      // 区域标注列表列定义
      regionColumns: [
        {
          title: '时间段',
          key: 'time',
          scopedSlots: { customRender: 'time' }
        },
        {
          title: '标签',
          dataIndex: 'label',
          key: 'label'
        },
        {
          title: '内容预览',
          dataIndex: 'content',
          key: 'content',
          ellipsis: true
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ],
      
      // 演示音频数据
      demoAudioBase64: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
      regionsPlugin: null,
    }
  },
  computed: {
    // 格式化标记点数据用于表格显示
    markerTableData() {
      return this.markers.map((marker, index) => ({
        key: index,
        time: this.formatTime(marker.time),
        label: marker.label,
        type: this.getTypeLabel(marker.type),
        rawTime: marker.time
      }));
    },
    
    // 格式化区域标注数据用于表格显示
    regionTableData() {
      return this.regions.map(region => ({
        key: region.id,
        id: region.id,
        start: region.start,
        end: region.end,
        label: region.data.label || '未命名片段',
        content: region.data.content ? 
          (region.data.content.length > 30 ? 
            region.data.content.substring(0, 30) + '...' : 
            region.data.content) : 
          '无内容'
      }));
    },
    
    // 获取当前选中的区域对象
    selectedRegion() {
      if (!this.selectedRegionId) return null;
      return this.regions.find(r => r.id === this.selectedRegionId);
    },
    
    // 详情面板标题
    detailTitle() {
      if (this.selectedType === 'marker') {
        return '标记点详情';
      } else if (this.selectedType === 'region') {
        return '片段标注详情';
      }
      return '标注详情';
    }
  },
  mounted() {
    // 初始化WaveSurfer
    this.initAudio();
  },
  beforeDestroy() {
    // 清理WaveSurfer实例
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
    }
  },
  methods: {
    initAudio() {
      // 清除之前的实例（如果有）
      if (this.wavesurfer) {
        this.wavesurfer.destroy();
      }
      
      // 创建 WaveSurfer 实例
      this.wavesurfer = WaveSurfer.create({
        container: this.$refs.waveformContainer,
        waveColor: '#3498db',
        progressColor: '#1890ff',
        cursorColor: '#f5222d',
        height: 150,
        barWidth: 2,
        barGap: 1,
        responsive: true,
        normalize: true,
        plugins: [
          RegionsPlugin.create({
            dragSelection: {
              slop: 5
            },
            regions: []
          })
        ]
      });
      
      // 绑定事件
      this.wavesurfer.on('ready', () => {
        this.audioLoaded = true;
        this.duration = this.wavesurfer.getDuration();
      });
      
      this.wavesurfer.on('play', () => {
        this.isPlaying = true;
      });
      
      this.wavesurfer.on('pause', () => {
        this.isPlaying = false;
      });
      
      this.wavesurfer.on('audioprocess', () => {
        this.currentTime = this.wavesurfer.getCurrentTime();
      });
      
      this.wavesurfer.on('seeking', () => {
        this.currentTime = this.wavesurfer.getCurrentTime();
      });
      
      this.wavesurfer.on('click', (e) => {
        this.handleWaveClick(e);
      });
      
      // 添加区域创建事件监听
      this.wavesurfer.on('region-created', region => {
        this.handleRegionCreated(region);
      });
      
      // 添加区域点击事件
      this.wavesurfer.on('region-click', (region, e) => {
        e.stopPropagation();
        this.selectRegion(region.id);
      });
      
      this.wavesurfer.on('region-update-end', (region) => {
        // 更新区域边界
        const existingRegion = this.regions.find(r => r.id === region.id);
        if (existingRegion) {
          existingRegion.start = region.start;
          existingRegion.end = region.end;
        }
      });
      
      // 加载演示音频
      const blob = this.dataURItoBlob(this.demoAudioBase64);
      const audioUrl = URL.createObjectURL(blob);
      this.wavesurfer.load(audioUrl);
      this.audioLoading = true;
    },
    
    // 修复updateDragSelection方法
    updateDragSelection() {
      // 检查wavesurfer和regions插件是否已初始化
      if (!this.wavesurfer || !this.wavesurfer.regions) return;
      
      // 根据当前工具启用或禁用区域拖拽选择
      const enableDragSelection = this.currentTool === 'addRegion';
      
      try {
        // 安全地启用/禁用区域拖拽选择
        if (enableDragSelection) {
          this.wavesurfer.regions.enableDragSelection({
            color: 'rgba(0, 128, 255, 0.1)'
          });
        } else {
          this.wavesurfer.regions.disableDragSelection();
        }
      } catch (error) {
        console.error('更新拖拽状态时出错:', error);
      }
    },
    
    // 处理新创建的区域
    handleRegionCreated(region) {
      // 只有在添加区域工具激活时才添加到管理列表
      if (this.currentTool !== 'addRegion') {
        region.remove();
        return;
      }
      
      // 设置初始属性
      region.label = `片段 ${this.regions.length + 1}`;
      region.content = '';
      region.type = 'speech';
      
      // 添加到区域列表
      this.regions.push(region);
      
      // 选中新创建的区域
      this.selectRegion(region.id);
    },
    
    // 初始化区域相关属性
    initRegions() {
      this.regions = [];
      this.selectedRegionId = null;
    },
    
    beforeAudioUpload(file) {
      const isAudio = file.type.startsWith('audio/');
      if (!isAudio) {
        this.$message.error('只能上传音频文件!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        this.$message.error('音频必须小于10MB!');
        return false;
      }
      return false; // 不上传到服务器，在前端处理
    },
    
    handleAudioChange(info) {
      if (info.file) {
        this.audioLoading = true;
        
        // 清空现有标注
        this.markers = [];
        this.selectedMarkerIndex = null;
        
        // 清空现有区域标注
        this.clearRegions();
        this.selectedRegionId = null;
        this.selectedType = null;
        
        // 读取文件并加载到WaveSurfer
        const reader = new FileReader();
        reader.onload = (e) => {
          this.wavesurfer.loadArrayBuffer(e.target.result);
          this.audioLoading = false;
        };
        reader.readAsArrayBuffer(info.file);
      }
    },
    
    playAudio() {
      if (this.isPlaying) {
        this.wavesurfer.pause();
      } else {
        this.wavesurfer.play();
      }
    },
    
    stopAudio() {
      this.wavesurfer.stop();
      this.isPlaying = false;
    },
    
    // 播放选中的区域
    playRegion(regionId) {
      const region = this.regions.find(r => r.id === regionId);
      if (region) {
        this.selectRegion(regionId);
        region.play();
      }
    },
    
    handleWaveClick(e) {
      if (this.currentTool !== 'addMarker') return;
      
      const position = e.offsetX / this.$refs.waveformContainer.offsetWidth;
      const time = this.wavesurfer.getDuration() * position;
      this.addMarker(time, position);
    },
    
    addMarker(time, position) {
      const marker = {
        time: time,
        position: position,
        label: `标记 ${this.markers.length + 1}`,
        type: 'speech',
        description: ''
      };
      
      this.markers.push(marker);
      this.selectedMarkerIndex = this.markers.length - 1;
      this.selectedType = 'marker';
      
      // 排序标注
      this.sortMarkers();
    },
    
    selectMarker(index) {
      this.selectedMarkerIndex = index;
      this.selectedType = 'marker';
      this.selectedRegionId = null; // 清除区域选择
    },
    
    selectRegion(regionId) {
      this.selectedRegionId = regionId;
      this.selectedType = 'region';
      this.selectedMarkerIndex = null; // 清除标记点选择
      
      // 高亮选中的区域
      this.regions.forEach(region => {
        if (region.id === regionId) {
          region.setOptions({ color: 'rgba(255, 0, 0, 0.2)' });
        } else {
          region.setOptions({ color: 'rgba(0, 0, 255, 0.1)' });
        }
      });
    },
    
    removeMarker(index) {
      this.$confirm({
        title: '确认删除此标注?',
        content: '删除后无法恢复',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.markers.splice(index, 1);
          if (this.selectedMarkerIndex === index) {
            this.selectedMarkerIndex = null;
            this.selectedType = null;
          } else if (this.selectedMarkerIndex > index) {
            this.selectedMarkerIndex--;
          }
        }
      });
    },
    
    removeRegion(regionId) {
      this.$confirm({
        title: '确认删除此片段标注?',
        content: '删除后无法恢复',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          // 找到并删除图形区域
          const regionIndex = this.regions.findIndex(r => r.id === regionId);
          if (regionIndex >= 0) {
            const region = this.regions[regionIndex];
            region.remove();  // 从波形中移除
            this.regions.splice(regionIndex, 1);  // 从数组中移除
            
            // 清除选择状态
            if (this.selectedRegionId === regionId) {
              this.selectedRegionId = null;
              this.selectedType = null;
            }
          }
        }
      });
    },
    
    // 清除所有区域
    clearRegions() {
      this.regions.forEach(region => {
        region.remove();
      });
      this.regions = [];
    },
    
    updateMarkerTime() {
      if (this.selectedMarkerIndex === null) return;
      
      const marker = this.markers[this.selectedMarkerIndex];
      marker.position = marker.time / this.duration;
      
      // 重新排序
      this.sortMarkers();
    },
    
    // 更新区域边界
    updateRegionBoundary() {
      if (!this.selectedRegion) return;
      
      // 更新wavesurfer区域
      this.selectedRegion.update({
        start: this.selectedRegion.start,
        end: this.selectedRegion.end
      });
    },
    
    // 更新区域数据
    updateRegionData() {
      // 数据已经通过双向绑定更新，不需要特殊处理
    },
    
    sortMarkers() {
      // 按时间排序
      this.markers.sort((a, b) => a.time - b.time);
      
      // 更新选中项的索引
      if (this.selectedMarkerIndex !== null) {
        const selectedMarker = this.markers[this.selectedMarkerIndex];
        const newIndex = this.markers.findIndex(m => m.time === selectedMarker.time);
        this.selectedMarkerIndex = newIndex;
      }
    },
    
    seekToMarker(index) {
      if (index < 0 || index >= this.markers.length) return;
      
      const time = this.markers[index].time;
      this.wavesurfer.seekTo(time / this.duration);
      this.selectMarker(index);
    },
    
    onRowClick(record) {
      this.selectMarker(record.key);
    },
    
    onRegionRowClick(record) {
      this.selectRegion(record.id);
      
      // 定位到区域
      const region = this.regions.find(r => r.id === record.id);
      if (region) {
        this.wavesurfer.seekTo(region.start / this.duration);
      }
    },
    
    getRowClassName(record) {
      return record.key === this.selectedMarkerIndex && this.selectedType === 'marker' ? 'selected-row' : '';
    },
    
    getRegionRowClassName(record) {
      return record.id === this.selectedRegionId && this.selectedType === 'region' ? 'selected-row' : '';
    },
    
    formatTime(time) {
      if (!time && time !== 0) return '00:00.00';
      
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const milliseconds = Math.floor((time % 1) * 100);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    },
    
    getTypeLabel(type) {
      const typeMap = {
        'speech': '语音',
        'music': '音乐',
        'noise': '噪音',
        'other': '其他'
      };
      
      return typeMap[type] || '未知';
    },
    
    dataURItoBlob(dataURI) {
      const byteString = atob(dataURI.split(',')[1]);
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([ab], { type: mimeString });
    }
  },
  watch: {
    // 监听工具变化，更新拖拽选择状态
    currentTool() {
      this.updateDragSelection();
    }
  }
}
</script>

<style scoped>
.audio-annotation {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.audio-actions {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.play-controls {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.time-display {
  margin-left: 16px;
  font-family: monospace;
  font-size: 14px;
  color: #555;
}

.audio-container {
  position: relative;
  height: 150px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  overflow: hidden;
}

.waveform-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.markers-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.marker {
  position: absolute;
  top: 0;
  height: 100%;
  width: 2px;
  pointer-events: all;
  cursor: pointer;
}

.marker-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background-color: #ff5500;
}

.marker-label {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 2px 4px;
  background-color: rgba(255, 85, 0, 0.8);
  color: white;
  font-size: 12px;
  border-radius: 2px;
  white-space: nowrap;
}

.marker.selected .marker-line {
  background-color: #ff0000;
  width: 3px;
}

.marker.selected .marker-label {
  background-color: #ff0000;
  font-weight: bold;
}

.upload-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  z-index: 3;
}

.selected-row {
  background-color: #e6f7ff;
}

/* 添加一些响应式样式 */
@media (max-width: 768px) {
  .play-controls {
    margin-left: 0;
    margin-top: 10px;
  }
  
  .time-display {
    margin-left: auto;
  }
}
</style> 