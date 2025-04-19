<template>
  <div class="exam-management">
    <h2>考试管理</h2>
    
    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="考试名称">
            <a-input 
              v-model="searchParams.examName" 
              placeholder="请输入考试名称" 
              allowClear
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="考试状态">
            <a-select
              v-model="searchParams.status"
              placeholder="请选择状态"
              style="width: 120px"
              allowClear
            >
              <a-select-option value="0">未开始</a-select-option>
              <a-select-option value="1">进行中</a-select-option>
              <a-select-option value="2">已结束</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <a-icon type="search" />查询
            </a-button>
            <a-button style="margin-left: 8px" @click="handleReset">
              <a-icon type="reload" />重置
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      
      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
        <div class="table-operations">
          <a-button type="primary" @click="handleAdd">
            <a-icon type="plus" />新增考试
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="examList"
          :rowKey="record => record.id"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <!-- 状态自定义渲染 -->
          <template slot="state" slot-scope="text">
            <a-tag :color="getStateColor(text)">
              {{ getStateName(text) }}
            </a-tag>
          </template>
          
          <!-- 组卷进度自定义渲染 -->
          <template slot="rollProgress" slot-scope="text, record">
            <div v-if="record.rollToken || record.rollProgress">
              <a-progress 
                :percent="record.rollProgress || 0" 
                size="small" 
                :status="getProgressStatus(record)" 
                :format="percent => `${percent}%`"
              />
              <div v-if="record.progressData" class="progress-details">
                <span>总数: {{ record.progressData.all }}</span>
                <span style="margin: 0 8px;">已完成: {{ record.progressData.finish }}</span>
                <span>待处理: {{ record.progressData.ing }}</span>
              </div>
            </div>
            <span v-else>未开始</span>
          </template>
          
          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleView(record)">
                <a-icon type="eye" />查看
              </a-button>
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>
              <a-button v-if="record.state === 0" type="link" size="small" @click="() => handleRollMaking(record)">
                <a-icon type="file-add" />组卷
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 添加/编辑考试对话框 -->
    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :maskClosable="false"
      width="700px"
    >
      <a-form-model
        ref="examForm"
        :model="examForm"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="考试名称" prop="examName">
          <a-input 
            v-model="examForm.examName" 
            placeholder="请输入考试名称"
          />
        </a-form-model-item>
        
        <a-form-model-item label="考试时间" prop="examTime">
          <a-range-picker
            :show-time="{ format: 'HH:mm:ss' }"
            format="YYYY-MM-DD HH:mm:ss"
            @change="onTimeChange"
            style="width: 100%"
          />
        </a-form-model-item>
        
        <a-form-model-item label="总分" prop="score">
          <a-input-number 
            v-model="examForm.score" 
            :min="0"
            style="width: 100%"
            placeholder="请输入总分"
          />
        </a-form-model-item>
        
        <a-form-model-item label="合格分数" prop="scorePass">
          <a-input-number 
            v-model="examForm.scorePass" 
            :min="0"
            :max="examForm.score || 100"
            style="width: 100%"
            placeholder="请输入合格分数"
          />
        </a-form-model-item>
        
        <a-form-model-item label="生成方式" prop="pageMode">
          <a-radio-group v-model="examForm.pageMode">
            <a-radio value="0">同题同序</a-radio>
            <a-radio value="1">同题不同序</a-radio>
            <a-radio value="2">不同题不同序</a-radio>
          </a-radio-group>
        </a-form-model-item>
        
        <a-form-model-item label="班级" prop="classIds">
          <a-select
            v-model="examForm.classIds"
            mode="multiple"
            placeholder="请选择班级"
            style="width: 100%"
            :options="classOptions"
          />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    
    <!-- 查看考试详情对话框 -->
    <a-modal
      title="考试详情"
      :visible="detailModalVisible"
      @cancel="handleDetailModalCancel"
      :maskClosable="false"
      footer={null}
      width="700px"
    >
      <a-spin :spinning="detailLoading">
        <template v-if="examDetail">
          <div class="exam-detail">
            <a-descriptions bordered :column="2" size="small" :colon="true">
              <a-descriptions-item label="考试名称" :span="2">
                {{ examDetail.examName }}
              </a-descriptions-item>
              
              <a-descriptions-item label="考试状态">
                <a-tag :color="getStateColor(examDetail.status)">
                  {{ getStateName(examDetail.status) }}
                </a-tag>
              </a-descriptions-item>
              
              <a-descriptions-item label="生成方式">
                {{ getPageModeName(examDetail.pageMode) }}
              </a-descriptions-item>
              
              <a-descriptions-item label="开始时间">
                {{ examDetail.startTime }}
              </a-descriptions-item>
              
              <a-descriptions-item label="结束时间">
                {{ examDetail.endTime }}
              </a-descriptions-item>
              
              <a-descriptions-item label="总分">
                {{ examDetail.score }}
              </a-descriptions-item>
              
              <a-descriptions-item label="合格分数">
                {{ examDetail.scorePass }}
              </a-descriptions-item>
              
              <a-descriptions-item label="班级" :span="2">
                <template v-if="examDetail.classList && examDetail.classList.length > 0">
                  <a-tag v-for="classId in examDetail.classList" :key="classId" style="margin-right: 4px; margin-bottom: 4px;">
                    {{ getClassName(classId) }}
                  </a-tag>
                </template>
                <template v-else>
                  无班级
                </template>
              </a-descriptions-item>
            </a-descriptions>
            
            <!-- 添加组卷按钮 -->
            <div class="exam-actions" style="margin-top: 16px; text-align: right;">
              <a-button type="primary" @click="handleExamConfig(examDetail.id)">
                <a-icon type="file-excel" />组卷设置
              </a-button>
            </div>
            
            <div v-if="examDetail.examPageSetTypeVoList && examDetail.examPageSetTypeVoList.length > 0" class="distribution-table">
              <h4>题目分布详情</h4>
              <a-table 
                :columns="distributionColumns" 
                :dataSource="examDetail.examPageSetTypeVoList"
                :pagination="false"
                :rowKey="record => record.id || record.typeId"
                size="small"
                bordered
                :scroll="{ y: 240 }"
              >
              </a-table>
            </div>
          </div>
        </template>
      </a-spin>
    </a-modal>
    
    <!-- 组卷弹窗 -->
    <a-modal
      title="组卷设置"
      :visible="paperModalVisible"
      :confirmLoading="paperLoading"
      @ok="handlePaperSubmit"
      @cancel="handlePaperModalCancel"
      width="700px"
    >
      <div class="paper-modal-content">
        <div class="template-actions">
          <a-button type="primary" icon="download" @click="downloadTemplate">
            下载组卷模板
          </a-button>
          <p class="tip-text">请先下载模板，按要求填写后上传</p>
        </div>
        
        <div class="upload-section">
          <h3>上传组卷文件</h3>
          <a-upload
            :file-list="paperForm.fileList"
            :before-upload="beforeUpload"
            @change="handleUploadChange"
            :action="apiUrls.importExamPageSetPoint"
            :data="{ examId: currentExamId }"
            name="file"
            :headers="{ 'X-Requested-With': null }"
          >
            <a-button>
              <a-icon type="upload" />选择文件
            </a-button>
            <span class="upload-hint">支持 .xlsx 格式，文件大小不超过2MB</span>
          </a-upload>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';
import moment from 'moment';
import { Modal } from 'ant-design-vue';
import { Upload } from 'ant-design-vue';

export default {
  name: 'ExamManagement',
  data() {
    return {
      // 搜索参数
      searchParams: {
        examName: '',
        status: undefined
      },
      // 表格列定义
      columns: [
        {
          title: '考试名称',
          dataIndex: 'examName',
          key: 'examName',
          ellipsis: true,
          width: '16%',
        },
        {
          title: '状态',
          dataIndex: 'state',
          key: 'state',
          width: '8%',
          scopedSlots: { customRender: 'state' },
        },
        {
          title: '组卷进度',
          dataIndex: 'rollProgress',
          key: 'rollProgress',
          width: '15%',
          scopedSlots: { customRender: 'rollProgress' },
        },
        {
          title: '开始时间',
          dataIndex: 'startTime',
          key: 'startTime',
          width: '15%',
        },
        {
          title: '结束时间',
          dataIndex: 'endTime',
          key: 'endTime',
          width: '15%',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
          width: '15%',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: '12%',
        },
      ],
      // API URLs
      apiUrls: {
        importExamPageSetPoint: API.EXAM.IMPORT_EXAM_PAGE_SET_POINT
      },
      // 考试列表数据
      examList: [],
      // 分页信息
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: total => `共 ${total} 条记录`,
      },
      // 加载状态
      loading: false,
      
      // 班级选项列表
      classOptions: [],
      
      // 添加/编辑考试相关
      modalTitle: '新增考试',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      examForm: {
        id: undefined,
        examName: '',
        startTime: '',
        endTime: '',
        score: 100,
        scorePass: 60,
        pageMode: '0',
        classIds: [],
      },
      rules: {
        examName: [
          { required: true, message: '请输入考试名称', trigger: 'blur' },
          { max: 100, message: '考试名称不能超过100个字符', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' }
        ],
        score: [
          { required: true, message: '请输入总分', trigger: 'blur' }
        ],
        scorePass: [
          { required: true, message: '请输入合格分数', trigger: 'blur' }
        ],
        pageMode: [
          { required: true, message: '请选择生成方式', trigger: 'change' }
        ],
        classIds: [
          { required: true, message: '请选择班级', trigger: 'change' }
        ]
      },
      
      // 查看考试详情相关
      detailModalVisible: false,
      detailLoading: false,
      examDetail: null,
      
      // 题目分布详情列定义
      distributionColumns: [
        {
          title: '题型',
          dataIndex: 'typeName',
          key: 'typeName',
          width: '30%',
        },
        {
          title: '题目数量',
          dataIndex: 'questionNum',
          key: 'questionNum',
          width: '20%',
        },
        {
          title: '每题分值',
          dataIndex: 'scorePer',
          key: 'scorePer',
          customRender: (text, record) => {
            // 优先使用scorePer，如果没有则尝试使用score
            return record.scorePer !== undefined ? record.scorePer : record.score;
          },
          width: '20%',
        },
        {
          title: '此题型总分',
          dataIndex: 'totalScore',
          key: 'totalScore',
          width: '30%',
        },
      ],
      
      // 组卷相关
      paperModalVisible: false,
      paperLoading: false,
      currentExamId: null,
      paperForm: {
        fileList: [],
      },
      
      // 组卷进度定时器
      progressTimers: {},
    };
  },
  created() {
    this.fetchExamList();
    this.fetchClassList();
  },
  methods: {
    // 获取考试列表
    fetchExamList() {
      this.loading = true;
      
      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize,
        },
        ...this.searchParams
      };
      
      console.log('发送查询参数:', params); // 调试日志
      
      axios.post(API.EXAM.PAGE, params)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const data = response.data.data || {};
            
            // 记录响应数据，帮助调试
            console.log('考试列表响应数据:', data.records);
            
            this.examList = data.records || [];
            
            // 更新分页信息
            this.pagination.total = data.total || 0;
            this.pagination.current = data.current || 1;
            this.pagination.pageSize = data.size || 10;
          } else {
            this.$message.error('获取考试列表失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取考试列表失败:', error);
          this.$message.error('获取考试列表失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 获取班级列表
    fetchClassList() {
      const params = {
        pageInfo: {
          page: 1,
          pageSize: 9999 // 使用较大的pageSize以获取所有班级
        }
      };
      
      axios.post(API.CLASS.PAGE, params)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const classes = response.data.data?.records || [];
            console.log('获取到的班级列表数据:', classes); // 调试日志
            this.classOptions = classes.map(cls => ({
              label: cls.className,
              value: cls.id || cls.className // 如果没有id字段，使用className作为value
            }));
          } else {
            this.$message.error('获取班级列表失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取班级列表失败:', error);
          this.$message.error('获取班级列表失败，请稍后重试');
        });
    },
    
    // 获取班级名称
    getClassName(classId) {
      const option = this.classOptions.find(opt => opt.value === classId);
      return option ? option.label : classId;
    },
    
    // 获取状态名称
    getStateName(state) {
      const stateMap = {
        0: '未开始',
        1: '进行中',
        2: '已结束',
      };
      return stateMap[state] || '未知状态';
    },
    
    // 获取状态颜色
    getStateColor(state) {
      const colorMap = {
        0: 'blue',
        1: 'green',
        2: 'gray',
      };
      return colorMap[state] || 'default';
    },
    
    // 获取生成方式名称
    getPageModeName(pageMode) {
      const modeMap = {
        0: '同题同序',
        1: '同题不同序',
        2: '不同题不同序',
      };
      return modeMap[pageMode] || '未知';
    },
    
    // 处理时间范围选择改变
    onTimeChange(dates) {
      if (dates && dates.length === 2) {
        this.examForm.startTime = dates[0].format('YYYY-MM-DD HH:mm:ss');
        this.examForm.endTime = dates[1].format('YYYY-MM-DD HH:mm:ss');
      } else {
        this.examForm.startTime = '';
        this.examForm.endTime = '';
      }
    },
    
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1;
      this.fetchExamList();
    },
    
    // 处理重置
    handleReset() {
      this.searchParams = {
        examName: '',
        status: undefined
      };
      this.pagination.current = 1;
      this.fetchExamList();
    },
    
    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchExamList();
    },
    
    // 处理添加考试
    handleAdd() {
      this.modalTitle = '新增考试';
      this.isEdit = false;
      this.examForm = {
        id: undefined,
        examName: '',
        startTime: '',
        endTime: '',
        score: 100,
        scorePass: 60,
        pageMode: '0',
        classIds: [],
      };
      this.modalVisible = true;
    },
    
    // 处理编辑考试
    handleEdit(record) {
      this.modalTitle = '编辑考试';
      this.isEdit = true;
      this.detailLoading = true;
      
      axios.get(`${API.EXAM.DETAIL}${record.id}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const detail = response.data.data || {};
            
            console.log('考试详情:', detail); // 调试日志
            
            // 构建表单数据
            this.examForm = {
              id: detail.id,
              examName: detail.examName,
              startTime: detail.startTime,
              endTime: detail.endTime,
              score: detail.score,
              scorePass: detail.scorePass,
              pageMode: String(detail.pageMode),
              classIds: detail.classList || [],
            };
            
            this.modalVisible = true;
          } else {
            this.$message.error('获取考试详情失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取考试详情失败:', error);
          this.$message.error('获取考试详情失败，请稍后重试');
        })
        .finally(() => {
          this.detailLoading = false;
        });
    },
    
    // 处理查看考试详情
    handleView(record) {
      this.detailLoading = true;
      this.detailModalVisible = true;
      
      axios.get(`${API.EXAM.DETAIL}${record.id}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const examData = response.data.data || {};
            console.log('获取到的考试详情:', examData); // 调试日志
            
            // 确保状态字段有值（如果API返回的status为null，则使用表格行的state值）
            if (examData.status === null || examData.status === undefined) {
              examData.status = record.state;
              console.log('使用表格行数据的状态值:', record.state);
            }
            
            // 处理examPageSetTypeVoList数据，确保字段匹配并计算总分
            if (examData.examPageSetTypeVoList && examData.examPageSetTypeVoList.length > 0) {
              examData.examPageSetTypeVoList = examData.examPageSetTypeVoList.map(item => {
                // 根据API返回的数据结构调整字段映射
                const mappedItem = {...item};
                
                // 如果API返回score字段但没有scorePer字段，则映射
                if (item.score !== undefined && item.scorePer === undefined) {
                  mappedItem.scorePer = item.score;
                }
                
                // 计算题型总分
                if (!mappedItem.totalScore) {
                  const questionNum = mappedItem.questionNum || 0;
                  const scorePerQuestion = mappedItem.scorePer || mappedItem.score || 0;
                  mappedItem.totalScore = questionNum * scorePerQuestion;
                }
                
                return mappedItem;
              });
              console.log('处理后的题目分布数据:', examData.examPageSetTypeVoList);
            }
            
            this.examDetail = examData;
          } else {
            this.$message.error('获取考试详情失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取考试详情失败:', error);
          this.$message.error('获取考试详情失败，请稍后重试');
        })
        .finally(() => {
          this.detailLoading = false;
        });
    },
    
    // 处理详情模态框取消
    handleDetailModalCancel() {
      this.detailModalVisible = false;
      this.examDetail = null;
    },
    
    // 处理模态框确认
    handleModalOk() {
      this.$refs.examForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 构建提交数据
          const data = { 
            ...this.examForm,
            // 将班级IDs转为逗号分隔字符串
            classIds: this.examForm.classIds.join(',')
          };
          
          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.EXAM.UPDATE : API.EXAM.SAVE;
          
          axios.post(apiUrl, data)
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success(this.isEdit ? '编辑考试成功' : '新增考试成功');
                this.modalVisible = false;
                this.fetchExamList();
                
                // 如果是新增考试，询问是否开始组卷
                if (!this.isEdit) {
                  console.log('新增考试成功，返回数据:', response.data);
                  
                  // 获取考试ID，处理不同的返回格式
                  let examId;
                  if (response.data.data) {
                    examId = typeof response.data.data === 'object' ? response.data.data.id : response.data.data;
                  }
                  
                  if (examId) {
                    console.log('获取到考试ID:', examId);
                    this.currentExamId = examId;
                    
                    // 使用Modal.confirm静态方法
                    Modal.confirm({
                      title: '是否开始组卷？',
                      content: '您可以立即开始为该考试组卷，或稍后在考试列表中操作。',
                      okText: '开始组卷',
                      cancelText: '稍后再说',
                      onOk: () => {
                        this.showPaperModal();
                      },
                    });
                  } else {
                    console.warn('未能获取到考试ID，无法显示组卷对话框');
                  }
                }
              } else {
                this.$message.error((this.isEdit ? '编辑考试失败：' : '新增考试失败：') + (response.data.msg || '未知错误'));
              }
            })
            .catch(error => {
              console.error(this.isEdit ? '编辑考试失败:' : '新增考试失败:', error);
              this.$message.error(this.isEdit ? '编辑考试失败，请稍后重试' : '新增考试失败，请稍后重试');
            })
            .finally(() => {
              this.modalLoading = false;
            });
        }
      });
    },
    
    // 处理模态框取消
    handleModalCancel() {
      this.modalVisible = false;
    },
    
    // 显示组卷弹窗
    showPaperModal() {
      this.paperForm = {
        fileList: [],
      };
      this.paperModalVisible = true;
    },
    
    // 处理组卷设置按钮点击
    handleExamConfig(examId) {
      if (!examId) {
        this.$message.warning('考试ID不能为空');
        return;
      }
      
      this.currentExamId = examId;
      this.showPaperModal();
    },
    
    // 处理组卷弹窗取消
    handlePaperModalCancel() {
      this.paperModalVisible = false;
    },
    
    // 下载模版
    downloadTemplate() {
      if(!this.currentExamId) {
        this.$message.warning('请先选择一个考试');
        return;
      }

      // 创建一个表单数据对象
      const formData = new FormData();
      formData.append('examId', this.currentExamId);
      
      // 使用POST请求下载文件
      axios.post(API.EXAM.EXAM_TYPE_SET_TEMPLATE, formData, {
        responseType: 'blob' // 重要：指定响应类型为blob
      })
        .then(response => {
          // 创建Blob对象
          const blob = new Blob([response.data]);
          
          // 创建下载链接
      const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          
          // 设置文件名（从响应头中获取或使用默认名称）
          const contentDisposition = response.headers['content-disposition'];
          let filename = '组卷模板.xlsx';
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch.length === 2) {
              filename = filenameMatch[1];
            }
          }
          
          link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
          
          // 清理
          URL.revokeObjectURL(link.href);
          this.$message.success('模板下载成功');
        })
        .catch(error => {
          this.$message.error('下载模板失败');
          console.error('下载模板失败:', error);
        });
    },
    
    // 处理文件上传前
    beforeUpload(file) {
      // 文件类型检查
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        this.$message.error('只能上传Excel文件!');
        return Upload.LIST_IGNORE;
      }
      
      // 文件大小检查
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.$message.error('文件大小不能超过2MB!');
        return Upload.LIST_IGNORE;
      }
      
      return true;
    },
    
    // 处理上传变化
    handleUploadChange(info) {
      let fileList = [...info.fileList];
      
      // 限制只能上传一个文件
      fileList = fileList.slice(-1);
      
      // 根据上传状态更新文件列表和显示消息
      if (info.file.status === 'uploading') {
        this.paperLoading = true;
        console.log('文件上传中...');
      } else if (info.file.status === 'done') {
        this.paperLoading = false;
        
        // 检查响应数据
        if (info.file.response && info.file.response.state === 'ok') {
          this.$message.success('组卷设置导入成功');
          
          // 如果当前正在查看该考试详情，则刷新详情
          if (this.detailModalVisible && this.examDetail && this.examDetail.id === this.currentExamId) {
            this.detailLoading = true;
            this.fetchExamDetail(this.currentExamId);
            
            // 延迟1秒再获取一次详情，以确保数据已更新
            setTimeout(() => {
              this.fetchExamDetail(this.currentExamId);
              this.detailLoading = false;
            }, 1000);
          }
        } else if (info.file.response && info.file.response.data) {
          // 处理导入失败情况，下载错误文件
          this.$message.warning('导入过程中出现错误，正在下载错误文件');
          this.downloadErrorFile(info.file.response.data);
          } else {
          this.$message.error('组卷设置导入失败：' + (info.file.response?.msg || '未知错误'));
          }
      } else if (info.file.status === 'error') {
        this.paperLoading = false;
        this.$message.error('组卷设置导入失败，请稍后重试');
        }
      
      this.paperForm.fileList = fileList;
    },
    
    // 提交组卷数据
    handlePaperSubmit() {
      // 文件已经在选择后自动上传，这里只需关闭对话框
      this.paperModalVisible = false;
    },
    
    // 下载错误文件
    downloadErrorFile(token) {
      const formData = new FormData();
      formData.append('token', token);
      
      axios.post(API.EXAM.GET_ERROR_EXAM_PAGE_SET_POINT, formData, {
        responseType: 'blob'
      })
        .then(response => {
          const blob = new Blob([response.data]);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = '导入错误信息.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(link.href);
          this.$message.info('已下载错误文件，请修改后重新上传');
        })
        .catch(error => {
          this.$message.error('下载错误文件失败');
          console.error('下载错误文件失败:', error);
        });
    },
    
    // 获取考试详情 (新增方法)
    fetchExamDetail(examId) {
      if (!examId) return;
      
      axios.get(`${API.EXAM.DETAIL}${examId}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            // 如果当前正在查看该考试详情，则更新详情
            if (this.detailModalVisible && this.examDetail && this.examDetail.id === examId) {
              this.examDetail = response.data.data || {};
            }
          }
        })
        .catch(error => {
          console.error('获取考试详情失败:', error);
        });
    },
    
    // 获取进度状态样式
    getProgressStatus(record) {
      const progress = record.rollProgress;
      if (progress === 100) return 'success';
      if (progress > 0 && progress < 100) return 'active';
      return 'normal';
    },
    
    // 处理组卷按钮点击
    handleRollMaking(record) {
      this.$confirm({
        title: '开始组卷',
        content: `确定要为考试 "${record.examName}" 生成试卷吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          this.startRollMaking(record.id);
        }
      });
    },
    
    // 开始组卷
    startRollMaking(examId) {
      // 先立即显示进度条，设置为'active'状态
      const index = this.examList.findIndex(item => item.id === examId);
      if (index !== -1) {
        this.$set(this.examList[index], 'rollProgress', 1); // 先设置为1%，显示进度已开始
      }
      
      axios.post(`${API.EXAM.ROLL_MAKING}/${examId}`)
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            const token = response.data.data;
            this.$message.success(response.data.msg || '开始组卷，请稍后查看进度');
            
            // 更新考试列表中对应记录的token
            if (index !== -1) {
              this.$set(this.examList[index], 'rollToken', token);
              // 保持进度为1%，表示刚开始
            }
            
            // 开始轮询进度
            this.startPollingProgress(examId, token);
          } else {
            // 如果失败，恢复进度条状态
            if (index !== -1) {
              this.$set(this.examList[index], 'rollProgress', 0);
            }
            this.$message.error(response.data.msg || '组卷失败，请稍后重试');
          }
        })
        .catch(error => {
          console.error('组卷失败:', error);
          // 如果失败，恢复进度条状态
          if (index !== -1) {
            this.$set(this.examList[index], 'rollProgress', 0);
          }
          this.$message.error('组卷失败，请稍后重试');
        });
    },
    
    // 开始轮询进度
    startPollingProgress(examId, token) {
      // 如果已经存在定时器，先清除
      if (this.progressTimers[examId]) {
        clearInterval(this.progressTimers[examId]);
      }
      
      // 创建新的定时器
      this.progressTimers[examId] = setInterval(() => {
        this.checkProgress(examId, token);
      }, 2000); // 每2秒查询一次进度
    },
    
    // 检查进度
    checkProgress(examId, token) {
      axios.post(`${API.EXAM.GET_PROGRESS}/${examId}/${token}`)
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            const progressData = response.data.data;
            
            // 计算进度百分比：已完成部分占总量的比例
            const all = progressData.all || 0;
            const finish = progressData.finish || 0;
            const percent = all > 0 ? Math.round((finish / all) * 100) : 0;
            
            // 更新考试列表中对应记录的进度
            const index = this.examList.findIndex(item => item.id === examId);
            if (index !== -1) {
              this.$set(this.examList[index], 'rollProgress', percent);
              // 保存完整进度数据，用于显示详情
              this.$set(this.examList[index], 'progressData', progressData);
            }
            
            // 如果 isOver 为 1（表示已完成）或进度为100%，停止轮询
            if (progressData.isOver === 1 || percent === 100) {
              this.stopPollingProgress(examId);
              this.$message.success('组卷完成');
              
              // 确保进度显示为100%
              if (index !== -1) {
                this.$set(this.examList[index], 'rollProgress', 100);
              }
            }
          } else {
            // 查询失败，停止轮询
            this.stopPollingProgress(examId);
            this.$message.error(response.data.msg || '获取进度失败');
          }
        })
        .catch(error => {
          console.error('获取进度失败:', error);
          this.stopPollingProgress(examId);
          this.$message.error('获取进度失败，请稍后重试');
        });
    },
    
    // 停止轮询进度
    stopPollingProgress(examId) {
      if (this.progressTimers[examId]) {
        clearInterval(this.progressTimers[examId]);
        delete this.progressTimers[examId];
      }
    },
    
    // 组件销毁前清除所有定时器
    beforeDestroy() {
      Object.keys(this.progressTimers).forEach(examId => {
        clearInterval(this.progressTimers[examId]);
      });
      this.progressTimers = {};
    },
  },
};
</script>

<style scoped>
.exam-management {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.search-card {
  margin-bottom: 16px;
  background: #f8f8f8;
}

.table-operations {
  margin-bottom: 16px;
  text-align: right;
}

.exam-detail {
  margin-top: 8px;
}

.exam-detail /deep/ .ant-descriptions-item-label,
.exam-detail /deep/ .ant-descriptions-item-content {
  padding: 8px 12px;
}

.distribution-table {
  margin-top: 16px;
}

.distribution-table h4 {
  margin-bottom: 8px;
  font-weight: 500;
}

.paper-modal-content {
  padding: 20px;
}

.template-actions {
  margin-bottom: 20px;
  text-align: center;
}

.tip-text {
  margin-top: 8px;
  color: #999;
}

.upload-section {
  margin-top: 20px;
}

.upload-section h3 {
  margin-bottom: 16px;
  font-weight: 500;
}

.upload-hint {
  display: block;
  margin-top: 8px;
  color: #999;
}

.progress-details {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style> 