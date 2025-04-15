<template>
  <div class="exam-list">
    <h2>我的考试</h2>
    
    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="考试名称">
            <a-input 
              v-model="searchParams.examName" 
              placeholder="请输入考试名称" 
              allowClear
              @pressEnter="fetchExamList"
            />
          </a-form-item>
          <a-form-item label="考试状态">
            <a-select
              v-model="searchParams.status"
              placeholder="请选择状态"
              style="width: 160px"
              allowClear
            >
              <a-select-option value="0">未开始</a-select-option>
              <a-select-option value="1">进行中</a-select-option>
              <a-select-option value="2">已完成</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="fetchExamList">
              <a-icon type="search" />查询
            </a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">
              <a-icon type="reload" />重置
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      
      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
        <a-table
          :columns="columns"
          :dataSource="examList"
          :rowKey="record => record.examId"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <!-- 选题状态 -->
          <template slot="selectStatus" slot-scope="text">
            <a-tag :color="getSelectStatusColor(text)">
              {{ getSelectStatusText(text) }}
            </a-tag>
          </template>
          
          <!-- 作答状态 -->
          <template slot="answerStatus" slot-scope="text">
            <a-tag :color="getAnswerStatusColor(text)">
              {{ getAnswerStatusText(text) }}
            </a-tag>
          </template>
          
          <!-- 合格状态 -->
          <template slot="passStatus" slot-scope="text, record">
            <template v-if="record.scoreTs">
              <a-tag :color="text === 1 ? 'green' : 'red'">
                {{ text === 1 ? '合格' : '不合格' }}
              </a-tag>
            </template>
            <template v-else>
              <span>--</span>
            </template>
          </template>
          
          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button 
                type="primary" 
                size="small" 
                @click="enterExam(record)"
                :disabled="!canEnterExam(record)"
              >
                进入考试
              </a-button>
              <a-button 
                v-if="record.scoreTs"
                type="link" 
                size="small" 
                @click="viewResult(record)"
              >
                查看成绩
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 查看成绩对话框 -->
    <a-modal
      title="考试成绩"
      :visible="resultModalVisible"
      @cancel="() => resultModalVisible = false"
      :footer="null"
      width="500px"
    >
      <div class="result-container" v-if="selectedExam">
        <div class="result-header">
          <div class="exam-name">{{ selectedExam.examName }}</div>
          <div class="exam-time">提交时间: {{ selectedExam.answerTs }}</div>
        </div>
        
        <div class="result-score">
          <div class="score-value">{{ selectedExam.score }}</div>
          <div class="score-label">分数</div>
        </div>
        
        <div class="result-status">
          <a-tag :color="selectedExam.passStatus === 1 ? 'green' : 'red'" style="font-size: 16px; padding: 5px 15px;">
            {{ selectedExam.passStatus === 1 ? '合格' : '不合格' }}
          </a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ExamList',
  data() {
    return {
      searchParams: {
        examName: '',
        status: undefined
      },
      loading: false,
      examList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '30', '50']
      },
      columns: [
        {
          title: '考试名称',
          dataIndex: 'examName',
          key: 'examName',
          width: '20%'
        },
        {
          title: '选题状态',
          dataIndex: 'selectStatus',
          scopedSlots: { customRender: 'selectStatus' },
          width: '12%'
        },
        {
          title: '作答状态',
          dataIndex: 'answerStatus',
          scopedSlots: { customRender: 'answerStatus' },
          width: '12%'
        },
        {
          title: '提交时间',
          dataIndex: 'answerTs',
          key: 'answerTs',
          width: '18%',
          customRender: text => text || '--'
        },
        {
          title: '得分',
          dataIndex: 'score',
          key: 'score',
          width: '8%',
          customRender: (text, record) => record.scoreTs ? text : '--'
        },
        {
          title: '合格状态',
          dataIndex: 'passStatus',
          scopedSlots: { customRender: 'passStatus' },
          width: '12%'
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: '18%'
        }
      ],
      resultModalVisible: false,
      selectedExam: null
    };
  },
  created() {
    this.fetchExamList();
  },
  methods: {
    // 获取考试列表数据
    fetchExamList() {
      this.loading = true;
      
      const params = {
        pageInfo: {
          pageNum: this.pagination.current,
          pageSize: this.pagination.pageSize
        },
        // 这里可以添加其他搜索条件
      };
      
      axios.post('/exam-page-user/page', params)
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            const data = response.data.data;
            this.examList = data.records;
            this.pagination.total = data.total;
          } else {
            this.$message.error(response.data.msg || '获取考试列表失败');
          }
        })
        .catch(error => {
          console.error('获取考试列表失败:', error);
          this.$message.error('获取考试列表失败');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 表格分页、排序、筛选变化时的回调
    handleTableChange(pagination) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchExamList();
    },
    
    // 重置搜索条件
    resetSearch() {
      this.searchParams = {
        examName: '',
        status: undefined
      };
      this.pagination.current = 1;
      this.fetchExamList();
    },
    
    // 获取选题状态文本
    getSelectStatusText(status) {
      const statusMap = {
        0: '未选题',
        1: '选题中',
        2: '选题完成'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 获取选题状态颜色
    getSelectStatusColor(status) {
      const colorMap = {
        0: 'orange',
        1: 'blue',
        2: 'green'
      };
      return colorMap[status] || 'default';
    },
    
    // 获取作答状态文本
    getAnswerStatusText(status) {
      const statusMap = {
        0: '未做答',
        1: '进行中',
        2: '已提交'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 获取作答状态颜色
    getAnswerStatusColor(status) {
      const colorMap = {
        0: 'orange',
        1: 'blue',
        2: 'green'
      };
      return colorMap[status] || 'default';
    },
    
    // 判断是否可以进入考试
    canEnterExam(record) {
      // 如果已提交，则不能再进入考试
      if (record.answerStatus === 2) {
        return false;
      }
      
      return true;
    },
    
    // 进入考试
    enterExam(record) {
      this.$router.push({
        name: 'ExamPage',
        params: { examId: record.examId }
      });
    },
    
    // 查看成绩
    viewResult(record) {
      this.selectedExam = record;
      this.resultModalVisible = true;
    }
  }
};
</script>

<style scoped>
.exam-list {
  padding: 20px;
}

.content-container {
  background: #fff;
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.action-buttons button {
  margin-right: 8px;
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;
}

.exam-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.exam-time {
  color: #888;
}

.result-score {
  margin: 20px 0;
  text-align: center;
}

.score-value {
  font-size: 64px;
  font-weight: bold;
  color: #1890ff;
}

.score-label {
  font-size: 16px;
  color: #888;
}

.result-status {
  margin-top: 20px;
}
</style> 