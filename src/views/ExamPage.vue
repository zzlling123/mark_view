<template>
  <div class="exam-page">
    <!-- 考试头部信息 -->
    <div class="exam-header">
      <div class="exam-info">
        <h2>{{ examInfo.examName || '加载中...' }}</h2>
      </div>
      <div class="exam-timer" v-if="examInfo.examId">
        <a-icon type="clock-circle" />
        <span class="timer-text">{{ formatTime(remainingTime) }}</span>
      </div>
      <div class="exam-actions">
        <a-button type="primary" @click="submitExam" :loading="submitting" :disabled="!canSubmit">
          交卷
        </a-button>
      </div>
    </div>

    <div class="exam-content" v-if="loading">
      <div class="loading-container">
        <a-spin tip="正在加载考试内容..."></a-spin>
      </div>
    </div>

    <div class="exam-content" v-else-if="!examInfo.examId">
      <a-empty description="考试信息不存在或已结束"></a-empty>
    </div>

    <div class="exam-content" v-else>
      <div class="question-navigation">
        <div class="progress-info">
          <div class="progress-title">答题进度</div>
          <div class="progress-stats">已完成 {{ getCompletedCount() }} / {{ questionProgress.length }}</div>
        </div>
        
        <div class="question-buttons">
          <a-tooltip v-for="item in questionProgress" :key="item.questionId" :title="`题目${item.num}: ${getStatusText(item.answerStatus)}`">
            <div 
              class="question-button" 
              :class="{
                'active': currentQuestion && currentQuestion.questionId === item.questionId,
                'completed': item.answerStatus === '2',
                'in-progress': item.answerStatus === '1',
                'not-started': item.answerStatus === '0'
              }"
              @click="switchQuestion(item.questionId)"
            >
              {{ item.num }}
            </div>
          </a-tooltip>
        </div>
      </div>

      <div class="question-container">
        <div class="question-content" v-if="currentQuestion">
          <div class="question-header">
            <span class="question-number">第 {{ currentQuestionIndex + 1 }} 题</span>
            <span class="question-score">{{ currentQuestion.score || 0 }}分</span>
          </div>
          
          <div class="question-body">
            <div class="question-title" v-html="currentQuestion.questionTitle"></div>
            
            <div class="question-options" v-if="currentQuestion.questionType === 1">
              <!-- 单选题 -->
              <a-radio-group v-model="currentAnswer" @change="handleAnswerChange">
                <a-radio 
                  v-for="option in currentQuestion.options" 
                  :key="option.optionKey" 
                  :value="option.optionKey"
                  class="option-item"
                >
                  <span class="option-key">{{ option.optionKey }}.</span>
                  <span v-html="option.optionValue"></span>
                </a-radio>
              </a-radio-group>
            </div>
            
            <div class="question-options" v-else-if="currentQuestion.questionType === 2">
              <!-- 多选题 -->
              <a-checkbox-group v-model="currentAnswerMultiple" @change="handleAnswerChange">
                <a-checkbox 
                  v-for="option in currentQuestion.options" 
                  :key="option.optionKey" 
                  :value="option.optionKey"
                  class="option-item"
                >
                  <span class="option-key">{{ option.optionKey }}.</span>
                  <span v-html="option.optionValue"></span>
                </a-checkbox>
              </a-checkbox-group>
            </div>
            
            <div class="question-options" v-else-if="currentQuestion.questionType === 3">
              <!-- 判断题 -->
              <a-radio-group v-model="currentAnswer" @change="handleAnswerChange">
                <a-radio value="T" class="option-item">
                  <span class="option-key">T.</span>
                  <span>正确</span>
                </a-radio>
                <a-radio value="F" class="option-item">
                  <span class="option-key">F.</span>
                  <span>错误</span>
                </a-radio>
              </a-radio-group>
            </div>
            
            <div class="question-options" v-else-if="currentQuestion.questionType === 4">
              <!-- 填空题 -->
              <a-textarea 
                v-model="currentAnswer" 
                placeholder="请在此输入您的答案"
                :rows="6"
                @change="handleAnswerChange"
              />
            </div>
            
            <div class="question-options" v-else-if="currentQuestion.questionType === 5">
              <!-- 简答题 -->
              <a-textarea 
                v-model="currentAnswer" 
                placeholder="请在此输入您的答案"
                :rows="10"
                @change="handleAnswerChange"
              />
            </div>
          </div>
          
          <div class="question-actions">
            <a-button 
              v-if="currentQuestionIndex > 0" 
              @click="prevQuestion"
            >
              上一题
            </a-button>
            <a-button 
              type="primary" 
              @click="nextQuestion"
              v-if="currentQuestionIndex < questionProgress.length - 1"
            >
              下一题
            </a-button>
          </div>
        </div>
        
        <div v-else class="no-question">
          <a-empty description="请选择一个题目"></a-empty>
        </div>
      </div>
    </div>
    
    <!-- 提交结果对话框 -->
    <a-modal
      title="考试结果"
      :visible="resultModalVisible"
      :closable="false"
      :maskClosable="false"
      :footer="null"
      width="500px"
    >
      <div class="result-container">
        <div class="result-icon">
          <a-icon type="check-circle" theme="filled" style="color: #52c41a; font-size: 64px;" />
        </div>
        <div class="result-title">考试已成功提交</div>
        
        <div class="result-score">
          <div class="score-value">{{ examResult.score }}</div>
          <div class="score-label">分数</div>
        </div>
        
        <div class="result-stats">
          <div class="total-score">总分: {{ examResult.totalScore }}</div>
        </div>
        
        <div class="result-actions">
          <a-button type="primary" @click="goToExamList">返回考试列表</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ExamPage',
  data() {
    return {
      examId: null,
      examInfo: {},
      loading: true,
      questionProgress: [],
      questions: [],
      currentQuestionIndex: 0,
      currentQuestion: null,
      currentAnswer: '',
      currentAnswerMultiple: [],
      submitting: false,
      heartbeatTimer: null,
      remainingTime: 0,
      resultModalVisible: false,
      examResult: {
        score: 0,
        totalScore: 0
      },
      canSubmit: false
    };
  },
  created() {
    this.examId = this.$route.params.examId;
    
    if (!this.examId) {
      this.$message.error('考试ID不能为空');
      return;
    }
    
    this.fetchExamInfo();
  },
  mounted() {
    // 开始心跳检测
    this.startHeartbeat();
    
    // 添加页面关闭提示
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeDestroy() {
    // 清除心跳定时器
    this.clearHeartbeat();
    
    // 移除页面关闭提示
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    // 获取考试信息
    fetchExamInfo() {
      this.loading = true;
      
      axios.post('/exam-page-user/getExamUserInfo', {
        examId: this.examId
      })
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            this.examInfo = response.data.data;
            this.questions = this.examInfo.questionVoList || [];
            
            // 获取答题进度
            this.fetchQuestionProgress();
          } else {
            this.$message.error(response.data.msg || '获取考试信息失败');
          }
        })
        .catch(error => {
          console.error('获取考试信息失败:', error);
          this.$message.error('获取考试信息失败');
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    // 获取答题进度
    fetchQuestionProgress() {
      axios.post('/exam-page-user/getExamUserProgress', {
        examId: this.examId
      })
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            this.questionProgress = response.data.data || [];
            
            // 如果有题目，默认选中第一题
            if (this.questionProgress.length > 0) {
              this.switchQuestion(this.questionProgress[0].questionId);
              this.canSubmit = true;
            }
          } else {
            this.$message.error(response.data.msg || '获取答题进度失败');
          }
        })
        .catch(error => {
          console.error('获取答题进度失败:', error);
          this.$message.error('获取答题进度失败');
        });
    },
    
    // 切换题目
    switchQuestion(questionId) {
      // 找到当前题目索引
      const index = this.questions.findIndex(q => q.questionId === questionId);
      if (index !== -1) {
        this.currentQuestionIndex = index;
        this.currentQuestion = this.questions[index];
        
        // 如果是多选题，使用数组存储答案
        if (this.currentQuestion.questionType === 2) {
          this.currentAnswerMultiple = this.currentQuestion.answer ? this.currentQuestion.answer.split(',') : [];
          this.currentAnswer = '';
        } else {
          this.currentAnswer = this.currentQuestion.answer || '';
          this.currentAnswerMultiple = [];
        }
      }
    },
    
    // 上一题
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        const prevQuestionId = this.questions[this.currentQuestionIndex - 1].questionId;
        this.switchQuestion(prevQuestionId);
      }
    },
    
    // 下一题
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        const nextQuestionId = this.questions[this.currentQuestionIndex + 1].questionId;
        this.switchQuestion(nextQuestionId);
      }
    },
    
    // 处理答案变更
    handleAnswerChange() {
      if (!this.currentQuestion) return;
      
      const answer = this.currentQuestion.questionType === 2 
        ? this.currentAnswerMultiple.join(',') 
        : this.currentAnswer;
      
      this.submitAnswer(this.currentQuestion.questionId, answer);
    },
    
    // 提交单个题目答案
    submitAnswer(questionId, answer) {
      axios.post('/exam-page-user/submitAnswer', {
        examId: this.examId,
        questionId: questionId,
        answer: answer
      })
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            // 更新答题进度
            this.updateQuestionProgress(questionId, '2'); // 设置为已完成
            
            // 更新本地题目答案
            const questionIndex = this.questions.findIndex(q => q.questionId === questionId);
            if (questionIndex !== -1) {
              this.questions[questionIndex].answer = answer;
            }
          } else {
            this.$message.error(response.data.msg || '提交答案失败');
          }
        })
        .catch(error => {
          console.error('提交答案失败:', error);
          this.$message.error('提交答案失败');
        });
    },
    
    // 更新题目进度状态
    updateQuestionProgress(questionId, status) {
      const progressIndex = this.questionProgress.findIndex(p => p.questionId === questionId);
      if (progressIndex !== -1) {
        this.questionProgress[progressIndex].answerStatus = status;
      }
    },
    
    // 获取已完成的题目数量
    getCompletedCount() {
      return this.questionProgress.filter(p => p.answerStatus === '2').length;
    },
    
    // 获取题目状态文本
    getStatusText(status) {
      const statusMap = {
        '0': '未作答',
        '1': '进行中',
        '2': '已完成'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 交卷
    submitExam() {
      // 检查是否有未完成的题目
      const uncompleted = this.questionProgress.filter(p => p.answerStatus !== '2');
      
      if (uncompleted.length > 0) {
        this.$confirm({
          title: '确认交卷',
          content: `您还有 ${uncompleted.length} 题未完成，确定要交卷吗？`,
          okText: '确认交卷',
          cancelText: '继续答题',
          onOk: () => {
            this.doSubmitExam();
          }
        });
      } else {
        this.doSubmitExam();
      }
    },
    
    // 执行交卷操作
    doSubmitExam() {
      this.submitting = true;
      
      axios.post('/exam-page-user/submitExam', {
        examId: this.examId
      })
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            this.submitting = false;
            this.examResult = response.data.data;
            this.resultModalVisible = true;
            
            // 清除心跳检测
            this.clearHeartbeat();
          } else {
            this.submitting = false;
            this.$message.error(response.data.msg || '交卷失败');
          }
        })
        .catch(error => {
          console.error('交卷失败:', error);
          this.$message.error('交卷失败');
          this.submitting = false;
        });
    },
    
    // 开始心跳检测
    startHeartbeat() {
      // 每30秒发送一次心跳
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat();
      }, 30000);
      
      // 立即发送一次心跳
      this.sendHeartbeat();
    },
    
    // 发送心跳请求
    sendHeartbeat() {
      if (!this.examId) return;
      
      axios.post('/exam-page-user/heartBeat', {
        examId: this.examId
      })
        .catch(error => {
          console.error('心跳检测失败:', error);
        });
    },
    
    // 清除心跳定时器
    clearHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },
    
    // 格式化时间
    formatTime(seconds) {
      if (seconds <= 0) return '00:00:00';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      return [hours, minutes, secs]
        .map(v => v < 10 ? '0' + v : v)
        .join(':');
    },
    
    // 页面关闭提示
    handleBeforeUnload(e) {
      const message = '离开页面将会中断考试，确定要离开吗？';
      e.returnValue = message;
      return message;
    },
    
    // 返回考试列表
    goToExamList() {
      this.$router.push({ name: 'ExamList' });
    }
  }
};
</script>

<style scoped>
.exam-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 40px);
  background-color: #f0f2f5;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.exam-info h2 {
  margin: 0;
  font-size: 18px;
}

.exam-timer {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #1890ff;
}

.timer-text {
  margin-left: 8px;
  font-weight: bold;
}

.exam-content {
  display: flex;
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.question-navigation {
  width: 240px;
  background-color: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-right: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.progress-info {
  margin-bottom: 16px;
}

.progress-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.progress-stats {
  font-size: 14px;
  color: #666;
}

.question-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.question-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.question-button.active {
  background-color: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.question-button.completed {
  background-color: #52c41a;
  color: #fff;
  border-color: #52c41a;
}

.question-button.in-progress {
  background-color: #faad14;
  color: #fff;
  border-color: #faad14;
}

.question-button.not-started {
  background-color: #f0f0f0;
  color: #666;
}

.question-container {
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
  overflow-y: auto;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.question-number {
  font-size: 16px;
  font-weight: bold;
}

.question-score {
  color: #ff4d4f;
  font-weight: bold;
}

.question-title {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.question-options {
  margin-bottom: 24px;
}

.option-item {
  display: block;
  margin-bottom: 16px;
}

.option-key {
  margin-right: 8px;
  font-weight: bold;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.no-question {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.result-container {
  text-align: center;
  padding: 24px 0;
}

.result-icon {
  margin-bottom: 16px;
}

.result-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
}

.result-score {
  margin: 24px 0;
}

.score-value {
  font-size: 64px;
  font-weight: bold;
  color: #1890ff;
  line-height: 1;
}

.score-label {
  font-size: 16px;
  color: #666;
  margin-top: 8px;
}

.result-stats {
  margin-bottom: 24px;
}

.total-score {
  font-size: 16px;
  color: #666;
}

.result-actions {
  margin-top: 24px;
}
</style> 