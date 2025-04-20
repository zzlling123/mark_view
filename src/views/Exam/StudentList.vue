<template>
  <div class="user-management">
    <h2>
      <img src="../../assets/back.png" width="25" style="cursor: pointer;" @click="goback"/>
      考试学生
    </h2>

    <div class="content-container">
      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">

        <a-table
            :columns="columns"
            :dataSource="userList"
            :rowKey="record => record.id"
            :pagination="pagination"
            :loading="loading"
            @change="handleTableChange"
        >
          <!-- 状态列自定义渲染 -->
          <template slot="onCorrect" slot-scope="text">
<!--            <a-badge :status="text === 1 ? 'success' : 'error'" />-->
            <span>{{ text === 1 ? '是' : '否' }}</span>
          </template>

          <template slot="needCorrect" slot-scope="text">
            <!--            <a-badge :status="text === 1 ? 'success' : 'error'" />-->
            <span>{{ text === 1 ? '是' : '否' }}</span>
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => chapterInfo(record)">
                <a-icon :type="record.needCorrect == 1 && record.onCorrect == 0 ? 'edit' : 'eye'" />
                <span>{{ record.needCorrect == 1 && record.onCorrect == 0 ? '批改' : '查看' }}</span>
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
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
      examId: null,
      classId: null,
      // 搜索参数
      searchParams: {
        chapterTitle: '',
        chapterOrder:''
      },
      // 表格列定义
      columns: [
        {
          title: '用户名称',
          dataIndex: 'realName',
          key: 'realName',
        },
        {
          title: '是否全部批改',
          dataIndex: 'onCorrect',
          key: 'onCorrect',
          scopedSlots: { customRender: 'onCorrect' },
        },
        {
          title: '是否需要批改',
          dataIndex: 'needCorrect',
          key: 'needCorrect',
          scopedSlots: { customRender: 'needCorrect' },
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: 280,
        },
      ],
      // 章节列表数据
      userList: [],
      // 分页配置
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: total => `共 ${total} 条`,
        pageSizeOptions: ['10', '20', '30', '50'],
      },
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
        // courseStatus: 1,
        // remark:''
      },
      rules: {
        chapterTitle: [
          { required: true, message: '请输入章节名称', trigger: 'blur' }
        ],
      },
    };
  },
  created() {
    this.examId = this.$route.params.examId;
    this.classId = this.$route.params.classId;
    this.fetchUserList();
  },
  methods: {
    //返回上一页
    goback() {
      this.$router.go(-1);
    },
    // 获取学生
    fetchUserList() {
      this.loading = true;
      const params = {
        classId: this.classId,
        examId: this.examId,
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize
        }
      };

      // 添加搜索条件
      if (this.searchParams.chapterTitle) {
        params.chapterTitle = this.searchParams.chapterTitle;
      }

      if (this.searchParams.chapterOrder) {
        params.chapterOrder = this.searchParams.chapterOrder;
      }

      axios.post(API.TEACHER_CORRECT.EXAM_STUDENG_LIST, params)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              const data = response.data.data;

              // 适配响应数据结构
              this.userList = data.records || [];

              // 更新分页信息
              this.pagination.total = data.total || 0;
              this.pagination.current = data.current || 1;
              this.pagination.pageSize = data.size || 10;
            } else {
              this.$message.error(response.data?.msg || '获取学生列表失败');
            }
          })
          .catch(error => {
            console.error('获取学生列表失败:', error);
            this.$message.error('获取学生列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 答题详情
    chapterInfo(record) {
      this.$router.push({
        name: 'AnswerDetails',
        params: {
          examPageUserId: record.id ,
          flag: (record.needCorrect == 1 && record.onCorrect == 0) ? 1 : 0
          // 批改、查看
        }
      });
    },

    // 处理搜索
    handleSearch() {
      this.pagination.current = 1; // 重置到第一页
      this.fetchUserList();
    },

    // 处理重置
    handleReset() {
      this.searchParams = {
        chapterTitle: '',
        chapterOrder: '',
        // courseStatus: undefined
      };
      this.pagination.current = 1;
      this.fetchUserList();
    },

    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchUserList();
    },

    // 处理添加章节
    handleAdd() {
      this.modalTitle = '新增章节';
      this.isEdit = false;
      this.courseForm = {
        chapterTitle: '',
        chapterOrder: '',
        description: '',
        // courseStatus: 1,
        // remark: ''
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.courseForm) {
          this.$refs.courseForm.clearValidate();
        }
      });
    },

    // 处理编辑章节
    handleEdit(record) {
      this.modalTitle = '编辑章节';
      this.isEdit = true;
      this.courseForm = {
        ...record,
        // 确保roleId是字符串类型
        roleId: record.roleId ? record.roleId.toString() : ''
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.courseForm) {
          this.$refs.courseForm.clearValidate();
        }
      });
    },

    // 处理删除章节
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该章节吗?',
        content: `章节名称: ${record.chapterTitle}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteUser(record.id);
        },
      });
    },

    // 调用删除章节API
    deleteUser(id) {
      this.loading = true;

      axios.post(`${API.TEACHER_CORRECT.DELETE}${id}`)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除章节成功');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '删除章节失败');
            }
          })
          .catch(error => {
            console.error('删除章节失败:', error);
            this.$message.error('删除章节失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 调用修改章节状态API
    updateUserState(id, state) {
      this.loading = true;

      axios.post(API.TEACHER_CORRECT.UPDATE_STATE, {
        ids: id.toString(),
        state: state
      })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success(state === 1 ? '章节已启用' : '章节已禁用');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '操作失败');
            }
          })
          .catch(error => {
            console.error('修改章节状态失败:', error);
            this.$message.error('修改章节状态失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理模态框确认
    handleModalOk() {
      this.$refs.courseForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;

          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.TEACHER_CORRECT.UPDATE : API.TEACHER_CORRECT.SAVE;
          const requestData = { courseId:this.courseId,...this.courseForm };

          // 编辑时不传密码字段
          if (this.isEdit) {
            delete requestData.password;
          }

          axios.post(apiUrl, requestData)
              .then(response => {
                if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                  this.$message.success(this.isEdit ? '编辑章节成功' : '新增章节成功');
                  this.modalVisible = false;
                  this.fetchUserList();
                } else {
                  this.$message.error(response.data?.msg || (this.isEdit ? '编辑章节失败' : '新增章节失败'));
                }
              })
              .catch(error => {
                console.error(this.isEdit ? '编辑章节失败:' : '新增章节失败:', error);
                this.$message.error(this.isEdit ? '编辑章节失败，请稍后重试' : '新增章节失败，请稍后重试');
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
.user-management {
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
</style>
