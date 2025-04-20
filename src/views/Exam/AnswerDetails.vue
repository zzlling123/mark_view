<template>
  <div class="user-management">
    <h2>
      <img src="../../assets/back.png" width="25" style="cursor: pointer;" @click="goback"/>
      答题详情
    </h2>

    <div class="content-container">

      <!-- 答题详情 -->
      <div>
        <div v-for="(item, index) in examPageUserQuestionVoList">
          <div class="questionBox">
            <div class="scoreBg"> {{item.userScore}}分 </div>
            <div class="corrected" v-if="item.correctId != '0'">
              <img src="../../assets/correct.png" width="75"/>
            </div>
            <div class="question">
              {{ item.num }}、({{ item.shape == '100' ? '单选' : item.shape == '200' ? '多选' : item.shape == '300' ?  '填空' : item.shape == '400' ? '主观题' : '操作题'}})
              <span>{{ item.question }}</span>
            </div>
            <div>
              <div class="answerMargin" v-if="item.shape == '400'" >
                <div>学生答案：{{ item.userAnswer }}</div>
                <div style="color: #42b983;margin-top: 5px;">正确答案：{{ item.answer }}</div>
                <div style="margin: 10px 0 10px 0;" v-if="flag == 1">
                  <a-form layout="inline">
                    <a-form-item label="">
                      <a-input v-model="item.userScore" placeholder="请输入分数" />
                    </a-form-item>
                    <a-button type="primary" @click="correctsubmit(item.id,item.userScore)">批改</a-button>
                  </a-form>
                </div>
              </div>
              <div class="answerMargin" v-else-if="item.shape == '100'">
                <a-checkbox-group disabled v-model:value="item.userAnswer" name="checkboxgroup" :options="item.options.replace(/^\[|\]$/g, '').split(',')" />
                <span style="color: #42b983;margin-left: 20px;">正确答案：{{ item.answer }}</span>
              </div>
              <div class="answerMargin" v-else-if="item.shape == '200'">
                <a-checkbox-group disabled v-model:value="item.userAnswer" name="checkboxgroup" :options="item.options.replace(/^\[|\]$/g, '').split(',')" />
                <span style="color: #42b983;margin-left: 20px;">正确答案：{{ item.answer }}</span>
              </div>
              <div class="answerMargin" v-else-if="item.shape == '300'">
                <div>学生答案：{{ item.userAnswer }}</div>
                <div style="color: #42b983;margin-top: 5px;">正确答案：{{ item.answer }}</div>
              </div>
              <div v-else class="answerMargin" style="padding-bottom: 50px;">

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'StudentList',
  data() {
    return {
      examPageUserId: null,
      examPageUserQuestionVoList:[],
      flag: '',
      // 加载状态
      loading: false,

      // 模态框相关
      modalTitle: '新增章节',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      courseForm: {
        id: undefined,
        chapterTitle: '',
        chapterOrder:'',
        description:''
      },
      rules: {
        chapterTitle: [
          { required: true, message: '请输入章节名称', trigger: 'blur' }
        ],
      },
    };
  },
  created() {

    this.examPageUserId = this.$route.params.examPageUserId;
    this.flag = this.$route.params.flag;
    this.fetchUserList();
  },
  methods: {
    //返回上一页
    goback() {
      this.$router.go(-1);
    },
    // 获取学生答题详情
    fetchUserList() {
      this.loading = true;

      axios.post(`${API.TEACHER_CORRECT.STUDENT_ANSWER_DETAIL}${this.examPageUserId}`)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              const data = response.data.data;
              this.examPageUserQuestionVoList = data.examPageUserQuestionVoList || [];

            } else {
              this.$message.error(response.data?.msg || '获取详情失败');
            }
          })
          .catch(error => {
            console.error('获取详情失败:', error);
            this.$message.error('获取详情失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    correctsubmit(id,score){
      const params = {
        userQuestionId: id,
        score:score
      };

      axios.post(API.TEACHER_CORRECT.CORRECT, params)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success(response.data?.msg);
              this.fetchUserList()
            } else {
              this.$message.error(response.data?.msg);
            }
          });
    }
  },
};
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}
.answerMargin{
  margin: 5px 0 0 0;
}
.questionBox{
  background: #F6F7FB;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 5px;
  position: relative;
}
.ant-form,.ant-form-item，.ant-form-inline .ant-form-item > .ant-form-item-control-wrapper, .ant-form-inline .ant-form-item > .ant-form-item-label{
  height: 32px;
}
/deep/.ant-form-item-control{
  line-height: 32px;
}
.question{
  font-size: 15px;
  color: #262626;
  margin: 10px 0;
}
.scoreBg{
  position: absolute;
  background: url("../../assets/flag.png") no-repeat;
  width: 57px;
  text-align: center;
  height: 75px;
  line-height: 50px;
  top: 2px;
  right: 30px;
  font-size: 20px;
  color: #ffffff;
}
.corrected{
  position: absolute;
  top: 5px;
  right: 110px;
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
</style>
