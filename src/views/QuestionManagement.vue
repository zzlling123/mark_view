<template>
  <div class="question-management">
    <h2>题库管理</h2>
    
    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="题目">
            <a-input 
              v-model="searchParams.question" 
              placeholder="请输入题目" 
              allowClear
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="题型">
            <a-select
              v-model="searchParams.type"
              placeholder="请选择题型"
              style="width: 150px"
              allowClear
            >
              <a-select-option 
                v-for="type in questionTypes" 
                :key="type.id" 
                :value="type.typeName"
              >
                {{ type.typeName }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="题目类型">
            <a-select
              v-model="searchParams.shape"
              placeholder="请选择题目类型"
              style="width: 150px"
              allowClear
            >
              <a-select-option value="100">单选题</a-select-option>
              <a-select-option value="200">多选题</a-select-option>
              <a-select-option value="300">填空题</a-select-option>
              <a-select-option value="400">主观题</a-select-option>
              <a-select-option value="500">操作题</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="难度">
            <a-select
              v-model="searchParams.difficultyLevel"
              placeholder="请选择难度"
              style="width: 120px"
              allowClear
            >
              <a-select-option value="1">简单</a-select-option>
              <a-select-option value="2">中等</a-select-option>
              <a-select-option value="3">困难</a-select-option>
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
            <a-icon type="plus" />新增题目
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="questionList"
          :rowKey="record => record.id"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <!-- 题目类型自定义渲染 -->
          <template slot="shape" slot-scope="text">
            <a-tag :color="getQuestionShapeColor(text)">
              {{ getQuestionShapeName(text) }}
            </a-tag>
          </template>
          
          <!-- 难度自定义渲染 -->
          <template slot="difficultyLevel" slot-scope="text">
            <a-tag :color="getDifficultyColor(text)">
              {{ getDifficultyName(text) }}
            </a-tag>
          </template>
          
          <!-- 状态自定义渲染 -->
          <template slot="state" slot-scope="text">
            <a-badge :status="text === 1 ? 'success' : 'error'" />
            <span>{{ text === 1 ? '启用' : '禁用' }}</span>
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
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 添加/编辑题目对话框 -->
    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :getContainer="() => document.body"
      :maskClosable="false"
      width="700px"
    >
      <a-form-model
        ref="questionForm"
        :model="questionForm"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="题目" prop="question">
          <a-textarea 
            v-model="questionForm.question" 
            :rows="3" 
            placeholder="请输入题目"
          />
        </a-form-model-item>
        
        <a-form-model-item label="题目类型" prop="shape">
          <a-select
            v-model="questionForm.shape"
            placeholder="请选择题目类型"
            style="width: 100%"
          >
            <a-select-option value="100">单选题</a-select-option>
            <a-select-option value="200">多选题</a-select-option>
            <a-select-option value="300">填空题</a-select-option>
            <a-select-option value="400">主观题</a-select-option>
            <a-select-option value="500">操作题</a-select-option>
          </a-select>
        </a-form-model-item>
        
        <a-form-model-item label="题型分类" prop="type">
          <a-select
            v-model="questionForm.type"
            placeholder="请选择题型分类"
            style="width: 100%"
          >
            <a-select-option 
              v-for="type in questionTypes" 
              :key="type.id" 
              :value="type.typeName"
            >
              {{ type.typeName }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        
        <a-form-model-item label="难度" prop="difficultyLevel">
          <a-select
            v-model="questionForm.difficultyLevel"
            placeholder="请选择难度"
            style="width: 100%"
          >
            <a-select-option value="1">简单</a-select-option>
            <a-select-option value="2">中等</a-select-option>
            <a-select-option value="3">困难</a-select-option>
          </a-select>
        </a-form-model-item>
        
        <template v-if="questionForm.shape === '100' || questionForm.shape === '200'">
          <a-form-model-item label="选项">
            <div v-for="(option, index) in questionForm.options" :key="index" style="margin-bottom: 8px">
              <a-input 
                v-model="questionForm.options[index]" 
                placeholder="请输入选项" 
                style="width: calc(100% - 30px)"
              />
              <a-button 
                type="link" 
                icon="delete" 
                @click="removeOption(index)" 
                style="margin-left: 8px"
              />
            </div>
            <a-button type="dashed" block @click="addOption">
              <a-icon type="plus" /> 添加选项
            </a-button>
          </a-form-model-item>
        </template>
        
        <a-form-model-item label="答案" prop="answer">
          <a-textarea 
            v-model="questionForm.answer" 
            :rows="2" 
            placeholder="请输入答案"
          />
        </a-form-model-item>
        
        <a-form-model-item label="解析">
          <a-textarea 
            v-model="questionForm.answerTip" 
            :rows="3" 
            placeholder="请输入解析"
          />
        </a-form-model-item>
        
        <a-form-model-item label="标签">
          <a-select
            v-model="questionForm.labels"
            mode="multiple"
            placeholder="请选择标签"
            style="width: 100%"
          >
            <a-select-option 
              v-for="label in labelList" 
              :key="label.id" 
              :value="label.id"
            >
              {{ label.labelName }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        
        <a-form-model-item label="状态">
          <a-switch 
            v-model="questionForm.state" 
            :checked="questionForm.state === 1"
            @change="val => questionForm.state = val ? 1 : 0"
          />
          <span style="margin-left: 8px">{{ questionForm.state === 1 ? '启用' : '禁用' }}</span>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    
    <!-- 查看题目详情对话框 -->
    <a-modal
      title="题目详情"
      :visible="detailModalVisible"
      @cancel="handleDetailModalCancel"
      :getContainer="() => document.body"
      :maskClosable="false"
      footer={null}
      width="700px"
    >
      <a-spin :spinning="detailLoading">
        <template v-if="questionDetail">
          <div class="question-detail">
            <a-descriptions bordered :column="1">
              <a-descriptions-item label="题目">
                {{ questionDetail.question }}
              </a-descriptions-item>
              
              <a-descriptions-item label="题目类型">
                <a-tag :color="getQuestionShapeColor(questionDetail.shape)">
                  {{ getQuestionShapeName(questionDetail.shape) }}
                </a-tag>
              </a-descriptions-item>
              
              <a-descriptions-item label="题型分类">
                {{ questionDetail.type }}
              </a-descriptions-item>
              
              <a-descriptions-item label="难度">
                <a-tag :color="getDifficultyColor(questionDetail.difficultyLevel)">
                  {{ getDifficultyName(questionDetail.difficultyLevel) }}
                </a-tag>
              </a-descriptions-item>
              
              <a-descriptions-item label="状态">
                <a-badge :status="questionDetail.state === 1 ? 'success' : 'error'" />
                <span>{{ questionDetail.state === 1 ? '启用' : '禁用' }}</span>
              </a-descriptions-item>
              
              <a-descriptions-item label="答案">
                {{ questionDetail.answer }}
              </a-descriptions-item>
              
              <a-descriptions-item label="解析">
                {{ questionDetail.answerTip || '无' }}
              </a-descriptions-item>
              
              <a-descriptions-item label="标签">
                <template v-if="questionDetail.labelList && questionDetail.labelList.length > 0">
                  <a-tag v-for="label in questionDetail.labelList" :key="label.id">
                    {{ label.labelName }}
                  </a-tag>
                </template>
                <template v-else>
                  无
                </template>
              </a-descriptions-item>
              
              <a-descriptions-item label="创建时间">
                {{ questionDetail.createTime }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'QuestionManagement',
  data() {
    return {
      // 搜索参数
      searchParams: {
        question: '',
        type: undefined,
        shape: undefined,
        difficultyLevel: undefined,
      },
      // 表格列定义
      columns: [
        {
          title: '题目',
          dataIndex: 'question',
          key: 'question',
          ellipsis: true,
          width: '30%',
        },
        {
          title: '题型',
          dataIndex: 'type',
          key: 'type',
          width: '10%',
        },
        {
          title: '题目类型',
          dataIndex: 'shape',
          key: 'shape',
          scopedSlots: { customRender: 'shape' },
          width: '10%',
        },
        {
          title: '难度',
          dataIndex: 'difficultyLevel',
          key: 'difficultyLevel',
          scopedSlots: { customRender: 'difficultyLevel' },
          width: '10%',
        },
        {
          title: '状态',
          dataIndex: 'state',
          key: 'state',
          scopedSlots: { customRender: 'state' },
          width: '10%',
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
          width: '15%',
        },
      ],
      // 题目列表数据
      questionList: [],
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
      
      // 题型分类数据
      questionTypes: [],
      // 标签列表数据
      labelList: [],
      
      // 添加/编辑题目相关
      modalTitle: '新增题目',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      questionForm: {
        id: undefined,
        question: '',
        shape: '100', // 默认单选题
        type: '',
        difficultyLevel: '1', // 默认简单
        options: ['', '', '', ''],
        answer: '',
        answerTip: '',
        state: 1,
        labels: [],
      },
      rules: {
        question: [
          { required: true, message: '请输入题目', trigger: 'blur' },
          { max: 255, message: '题目不能超过255个字符', trigger: 'blur' }
        ],
        shape: [
          { required: true, message: '请选择题目类型', trigger: 'change' }
        ],
        type: [
          { required: true, message: '请选择题型分类', trigger: 'change' }
        ],
        difficultyLevel: [
          { required: true, message: '请选择难度', trigger: 'change' }
        ],
        answer: [
          { required: true, message: '请输入答案', trigger: 'blur' }
        ]
      },
      
      // 查看题目详情相关
      detailModalVisible: false,
      detailLoading: false,
      questionDetail: null,
    };
  },
  created() {
    this.fetchQuestionList();
    this.fetchQuestionTypes();
    this.fetchLabelList();
  },
  methods: {
    // 获取题库列表
    fetchQuestionList() {
      this.loading = true;
      
      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize,
        },
        ...this.searchParams
      };
      
      axios.post(API.QUESTION.PAGE, params)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const data = response.data.data || {};
            
            // 确保每条记录有ID
            this.questionList = (data.records || []).map(item => ({
              ...item,
              id: item.id || `temp_${Math.random().toString(36).substr(2, 9)}` // 如果没有ID，生成临时ID
            }));
            
            // 更新分页信息
            this.pagination.total = data.total || 0;
            this.pagination.current = data.current || 1;
            this.pagination.pageSize = data.size || 10;
          } else {
            this.$message.error('获取题目列表失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取题目列表失败:', error);
          this.$message.error('获取题目列表失败，请稍后重试');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 获取题型分类列表
    fetchQuestionTypes() {
      axios.post(API.QUESTION_TYPE.GET_LIST)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            this.questionTypes = response.data.data || [];
          } else {
            this.$message.error('获取题型分类失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取题型分类失败:', error);
          this.$message.error('获取题型分类失败，请稍后重试');
        });
    },
    
    // 获取标签列表
    fetchLabelList() {
      // 假设后端提供了获取标签列表的API
      this.labelList = [
        { id: 1, labelName: '基础' },
        { id: 2, labelName: '进阶' },
        { id: 3, labelName: '实战' },
      ];
    },
    
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1;
      this.fetchQuestionList();
    },
    
    // 处理重置
    handleReset() {
      this.searchParams = {
        question: '',
        type: undefined,
        shape: undefined,
        difficultyLevel: undefined,
      };
      this.pagination.current = 1;
      this.fetchQuestionList();
    },
    
    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchQuestionList();
    },
    
    // 获取题目类型名称
    getQuestionShapeName(shape) {
      const shapeMap = {
        '100': '单选题',
        '200': '多选题',
        '300': '填空题',
        '400': '主观题',
        '500': '操作题',
      };
      return shapeMap[shape] || '未知类型';
    },
    
    // 获取题目类型颜色
    getQuestionShapeColor(shape) {
      const colorMap = {
        '100': 'blue',
        '200': 'green',
        '300': 'orange',
        '400': 'purple',
        '500': 'red',
      };
      return colorMap[shape] || 'default';
    },
    
    // 获取难度名称
    getDifficultyName(level) {
      const levelMap = {
        '1': '简单',
        '2': '中等',
        '3': '困难',
      };
      return levelMap[level] || '未知';
    },
    
    // 获取难度颜色
    getDifficultyColor(level) {
      const colorMap = {
        '1': 'green',
        '2': 'orange',
        '3': 'red',
      };
      return colorMap[level] || 'default';
    },
    
    // 添加选项
    addOption() {
      this.questionForm.options.push('');
    },
    
    // 移除选项
    removeOption(index) {
      this.questionForm.options.splice(index, 1);
    },
    
    // 处理添加题目
    handleAdd() {
      this.modalTitle = '新增题目';
      this.isEdit = false;
      this.questionForm = {
        id: undefined,
        question: '',
        shape: '100',
        type: '',
        difficultyLevel: '1',
        options: ['', '', '', ''],
        answer: '',
        answerTip: '',
        state: 1,
        labels: [],
      };
      this.modalVisible = true;
    },
    
    // 处理编辑题目
    handleEdit(record) {
      this.modalTitle = '编辑题目';
      this.isEdit = true;
      this.detailLoading = true;
      
      axios.get(`${API.QUESTION.DETAIL}${record.id}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            const detail = response.data.data || {};
            
            // 构建表单数据
            this.questionForm = {
              id: detail.id,
              question: detail.question,
              shape: detail.shape,
              type: detail.type,
              difficultyLevel: detail.difficultyLevel,
              options: detail.options || ['', '', '', ''],
              answer: detail.answer || '',
              answerTip: detail.answerTip || '',
              state: detail.state,
              labels: detail.labelList ? detail.labelList.map(label => label.id) : [],
            };
            
            this.modalVisible = true;
          } else {
            this.$message.error('获取题目详情失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取题目详情失败:', error);
          this.$message.error('获取题目详情失败，请稍后重试');
        })
        .finally(() => {
          this.detailLoading = false;
        });
    },
    
    // 处理查看题目详情
    handleView(record) {
      this.detailLoading = true;
      this.detailModalVisible = true;
      
      axios.get(`${API.QUESTION.DETAIL}${record.id}`)
        .then(response => {
          if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
            this.questionDetail = response.data.data || {};
          } else {
            this.$message.error('获取题目详情失败：' + (response.data.msg || '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取题目详情失败:', error);
          this.$message.error('获取题目详情失败，请稍后重试');
        })
        .finally(() => {
          this.detailLoading = false;
        });
    },
    
    // 处理详情模态框取消
    handleDetailModalCancel() {
      this.detailModalVisible = false;
      this.questionDetail = null;
    },
    
    // 处理删除题目
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除这个题目吗?',
        content: '此操作不可逆，请谨慎操作',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.loading = true;
          
          axios.post(API.QUESTION.DELETE, { ids: [record.id] })
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success('删除题目成功');
                this.fetchQuestionList();
              } else {
                this.$message.error('删除题目失败：' + (response.data.msg || '未知错误'));
              }
            })
            .catch(error => {
              console.error('删除题目失败:', error);
              this.$message.error('删除题目失败，请稍后重试');
            })
            .finally(() => {
              this.loading = false;
            });
        },
      });
    },
    
    // 处理模态框确认
    handleModalOk() {
      this.$refs.questionForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 构建提交数据
          const data = { ...this.questionForm };
          
          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.QUESTION.UPDATE : API.QUESTION.SAVE;
          
          axios.post(apiUrl, data)
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success(this.isEdit ? '编辑题目成功' : '新增题目成功');
                this.modalVisible = false;
                this.fetchQuestionList();
              } else {
                this.$message.error((this.isEdit ? '编辑题目失败：' : '新增题目失败：') + (response.data.msg || '未知错误'));
              }
            })
            .catch(error => {
              console.error(this.isEdit ? '编辑题目失败:' : '新增题目失败:', error);
              this.$message.error(this.isEdit ? '编辑题目失败，请稍后重试' : '新增题目失败，请稍后重试');
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
  },
};
</script>

<style scoped>
.question-management {
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

.action-buttons {
  display: flex;
  justify-content: space-between;
}

.action-buttons button {
  padding: 0 8px;
}

.question-detail {
  margin-top: 16px;
}
</style> 