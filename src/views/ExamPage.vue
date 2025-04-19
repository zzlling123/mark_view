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
          <a-tooltip v-for="item in examInfo.questionVoList" :key="item.numSort" :title="`题目${item.num}: ${getQuestionTypeText(item.shape)}`">
            <div 
              class="question-button" 
              :class="{
                'active': currentQuestion && currentQuestion.questionId === item.numSort,
                'completed': item.userAnswer && item.userAnswer.length > 0,
                'not-started': !item.userAnswer || item.userAnswer.length === 0
              }"
              @click="switchQuestion(item.numSort)"
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
                  <span class="option-text">
                    <span class="option-key">{{ option.optionKey }}.</span>
                    <span class="option-value">{{ option.optionValue }}</span>
                  </span>
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
                  <span class="option-text">
                    <span class="option-key">{{ option.optionKey }}.</span>
                    <span class="option-value">{{ option.optionValue }}</span>
                  </span>
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
            
            <div class="question-options" v-else-if="currentQuestion.questionType === 6">
              <!-- 操作题 -->
              <div class="operation-instructions">
                <a-alert
                  message="操作题"
                  description="这是一道操作题，请点击'开始操作'按钮进入操作界面完成任务。"
                  type="info"
                  show-icon
                />
                <div class="operation-btn-container">
                  <a-button 
                    type="primary" 
                    size="large"
                    icon="play-circle" 
                    @click="startOperation"
                  >
                    开始操作
                  </a-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="question-actions">
            <div class="left-buttons">
              <a-button 
                v-if="currentQuestionIndex > 0" 
                @click="prevQuestion"
              >
                <a-icon type="left" /> 上一题
              </a-button>
            </div>

            <div class="center-buttons">
              <a-button 
                type="primary" 
                @click="submitCurrentAnswer"
                v-if="currentQuestion && (currentAnswer || currentAnswerMultiple.length > 0) && currentQuestion.questionType !== 6"
                :loading="submitLoading"
              >
                提交答案 <a-icon type="check" />
              </a-button>
            </div>

            <div class="right-buttons">
              <a-button 
                type="primary" 
                @click="nextQuestion"
                v-if="currentQuestionIndex < examInfo.questionVoList.length - 1"
              >
                下一题 <a-icon type="right" />
              </a-button>
            </div>
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
import { Modal } from 'ant-design-vue';

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
      canSubmit: false,
      submitLoading: false
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
      
      // 使用接口URL前缀
      axios.post('/exam-page-user/getExamUserInfo', {
        examId: this.examId
      })
        .then(response => {
          if (response.data && response.data.state === 'ok') {
            this.examInfo = response.data.data;
            
            // 如果有题目，默认选中第一题
            if (this.examInfo.questionVoList && this.examInfo.questionVoList.length > 0) {
              this.switchQuestion(this.examInfo.questionVoList[0].numSort);
              this.canSubmit = true;
            }
            
            // 更新剩余时间
            this.updateRemainingTime();
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
      // 从questionVoList中找到对应的题目
      const question = this.examInfo.questionVoList.find(q => q.numSort === questionId);
      
      if (question) {
        this.currentQuestionIndex = questionId - 1; // 题号是从1开始的，索引从0开始
        this.currentQuestion = this.processQuestion(question);
        
        // 根据题目类型设置答案
        if (question.shape === '200') { // 多选题
          this.currentAnswerMultiple = question.userAnswer ? question.userAnswer.split(',') : [];
          this.currentAnswer = '';
        } else {
          this.currentAnswer = question.userAnswer || '';
          this.currentAnswerMultiple = [];
        }
      }
    },
    
    // 处理题目数据，转换为界面可用的格式
    processQuestion(question) {
      // 确定题目类型
      let questionType;
      switch(question.shape) {
        case '100': questionType = 1; break; // 单选题
        case '200': questionType = 2; break; // 多选题
        case '300': questionType = 4; break; // 填空题
        case '400': questionType = 5; break; // 主观题
        case '500': questionType = 6; break; // 操作题，使用单独的questionType
        default: questionType = 1;
      }
      
      // 处理选项
      let options = [];
      if (question.shape === '100' || question.shape === '200') {
        try {
          // 尝试解析选项字符串
          let optionsArray = [];
          if (question.options.startsWith('[') && question.options.endsWith(']')) {
            // 如果是JSON格式的字符串
            optionsArray = JSON.parse(question.options);
          } else {
            // 如果是逗号分隔的字符串
            optionsArray = question.options.split(',');
          }
          
          options = optionsArray.map(opt => {
            const cleanOpt = typeof opt === 'string' ? opt.trim().replace(/^"|"$/g, '') : opt;
            return {
              optionKey: cleanOpt,
              optionValue: cleanOpt
            };
          });
        } catch (e) {
          console.error('解析选项失败:', e, question.options);
          // 安全的回退方式
          options = [
            { optionKey: 'A', optionValue: 'A' },
            { optionKey: 'B', optionValue: 'B' },
            { optionKey: 'C', optionValue: 'C' },
            { optionKey: 'D', optionValue: 'D' }
          ];
        }
      }
      
      return {
        questionId: question.numSort,
        questionTitle: question.question,
        questionType: questionType,
        options: options,
        score: question.score,
        answer: question.userAnswer
      };
    },
    
    // 上一题
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        const prevQuestion = this.examInfo.questionVoList[this.currentQuestionIndex - 1];
        if (prevQuestion) {
          this.switchQuestion(prevQuestion.numSort);
        }
      }
    },
    
    // 下一题
    nextQuestion() {
      if (this.currentQuestionIndex < this.examInfo.questionVoList.length - 1) {
        const nextQuestion = this.examInfo.questionVoList[this.currentQuestionIndex + 1];
        if (nextQuestion) {
          this.switchQuestion(nextQuestion.numSort);
        }
      }
    },
    
    // 处理答案变更
    handleAnswerChange() {
      if (!this.currentQuestion) return;
      
      const answer = this.currentQuestion.questionType === 2 
        ? this.currentAnswerMultiple.join(',') 
        : this.currentAnswer;
      
      // 找到当前问题在原始数据中的索引
      const index = this.examInfo.questionVoList.findIndex(q => q.numSort === this.currentQuestion.questionId);
      if (index !== -1) {
        // 更新原始数据中的答案，但不提交
        this.examInfo.questionVoList[index].userAnswer = answer;
      }
    },
    
    // 提交单个题目答案
    submitAnswer(questionId, answer) {
      return new Promise((resolve, reject) => {
        axios.post('/exam-page-user/submitAnswer', {
          examId: this.examId,
          questionId: questionId,
          answer: answer
        })
          .then(response => {
            if (response.data && response.data.state === 'ok') {
              console.log(`题目${questionId}提交成功`, answer);
              resolve(response.data);
            } else {
              this.$message.error(response.data.msg || '提交答案失败');
              reject(new Error(response.data.msg || '提交答案失败'));
            }
          })
          .catch(error => {
            console.error('提交答案失败:', error);
            this.$message.error('提交答案失败');
            reject(error);
          });
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
      if (!this.examInfo.questionVoList) return 0;
      return this.examInfo.questionVoList.filter(q => q.userAnswer && q.userAnswer.length > 0).length;
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
      const uncompleted = this.examInfo.questionVoList.filter(q => !q.userAnswer || q.userAnswer.length === 0);
      
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
      
      axios.post('/annotation/exam-page-user/submitExam', {
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
    },
    
    // 获取题目类型文本
    getQuestionTypeText(shape) {
      const typeMap = {
        '100': '单选题',
        '200': '多选题',
        '300': '填空题',
        '400': '简答题',
        '500': '简答题',
        '600': '操作题'
      };
      return typeMap[shape] || '未知类型';
    },
    
    // 更新剩余时间
    updateRemainingTime() {
      // 实现更新剩余时间的逻辑
    },
    
    // 提交当前答案
    submitCurrentAnswer() {
      if (!this.currentQuestion) return;
      
      this.submitLoading = true;
      
      const answer = this.currentQuestion.questionType === 2 
        ? this.currentAnswerMultiple.join(',') 
        : this.currentAnswer;
      
      this.submitAnswer(this.currentQuestion.questionId, answer)
        .then(() => {
          this.$message.success('答案提交成功');
          
          // 如果还有下一题，自动跳到下一题
          if (this.currentQuestionIndex < this.examInfo.questionVoList.length - 1) {
            this.nextQuestion();
          }
        })
        .finally(() => {
          this.submitLoading = false;
        });
    },
    
    // 获取原始题目数据
    getOriginalQuestion(questionId) {
      return this.examInfo.questionVoList.find(q => q.numSort === questionId);
    },
    
    // 判断是否为操作题
    isOperationQuestion() {
      if (!this.currentQuestion) return false;
      
      const question = this.getOriginalQuestion(this.currentQuestion.questionId);
      return question && question.shape === '500';
    },
    
    // 开始操作
    startOperation() {
      if (!this.isOperationQuestion()) return;
      
      const question = this.getOriginalQuestion(this.currentQuestion.questionId);
      if (question) {
        // 跳转到操作系统，将题目ID传递过去
        const operationUrl = `/operation/${this.examId}/${question.numSort}`;
        
        // 在新窗口打开操作页面
        window.open(operationUrl, '_blank');
      }
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

.option-text {
  display: flex;
}

.option-key {
  margin-right: 8px;
  font-weight: bold;
  flex-shrink: 0;
  min-width: 20px;
}

.option-value {
  flex: 1;
}

/* 确保多选框对齐 */
.ant-checkbox-wrapper {
  display: flex;
  align-items: flex-start;
}

.ant-checkbox {
  top: 2px;
  margin-right: 8px;
}

/* 单选按钮和多选框统一对齐 */
.question-options .ant-radio-wrapper,
.question-options .ant-checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  padding: 8px 16px;
  margin-left: 0;
  width: 100%;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.left-buttons {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
}

.center-buttons {
  flex: 2;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.right-buttons {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.operation-instructions {
  margin: 24px 0;
}

.operation-btn-container {
  margin-top: 24px;
  text-align: center;
}

.operation-btn-container .ant-btn {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
}
</style> 