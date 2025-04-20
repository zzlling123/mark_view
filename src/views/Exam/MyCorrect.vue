<template>
  <div class="user-management">
    <h2>我的批改</h2>

    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="班级">
            <a-select
                v-model="searchParams.classId"
                placeholder="请选择班级"
                style="width: 150px"
            >
              <a-select-option
                  v-for="item in classList"
                  :key="item.id"
                  :value="item.id"
              >
                {{ item.className }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <a-icon type="search" />查询
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
<!--        <div class="table-operations">-->
<!--          <a-button type="primary" @click="handleAdd">-->
<!--            <a-icon type="user-add" />新增用户-->
<!--          </a-button>-->
<!--        </div>-->

        <a-table
            :columns="columns"
            :dataSource="userList"
            :rowKey="record => record.examId"
            :pagination="pagination"
            :loading="loading"
            @change="handleTableChange"
        >
          <!-- 考试状态 -->
          <template slot="state" slot-scope="text">
            <a-tag :color="getDifficultyColor(text)">
              {{ getDifficultyName(text) }}
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
<!--              <a-button type="link" size="small" @click="() => handleEdit(record)">-->
<!--                <a-icon type="edit" />编辑-->
<!--              </a-button>-->
              <a-button type="link" size="small" @click="() => stuList(record)">
                <a-icon type="key" />考试学生
              </a-button>
<!--              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">-->
<!--                <a-icon type="delete" />删除-->
<!--              </a-button>-->
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
        width="700px"
    >
      <a-form-model
          ref="userForm"
          :model="userForm"
          :rules="rules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="账号" prop="username">
          <a-input
              v-model="userForm.username"
              placeholder="请输入账号"
              :disabled="isEdit"
          />
        </a-form-model-item>

        <a-form-model-item label="姓名" prop="realName">
          <a-input
              v-model="userForm.realName"
              placeholder="请输入姓名"
          />
        </a-form-model-item>

        <a-form-model-item label="性别" prop="sex">
          <a-radio-group v-model="userForm.sex">
            <a-radio :value="1">男</a-radio>
            <a-radio :value="2">女</a-radio>
          </a-radio-group>
        </a-form-model-item>

        <a-form-model-item label="角色" prop="classId">
          <a-select
              v-model="userForm.classId"
              placeholder="请选择角色"
              style="width: 100%"
          >
            <a-select-option
                v-for="role in classList"
                :key="role.id"
                :value="role.id.toString()"
            >
              {{ role.roleName }}
            </a-select-option>
          </a-select>
        </a-form-model-item>

        <a-form-model-item label="状态" prop="state">
          <a-radio-group v-model="userForm.state">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-model-item>

        <a-form-model-item label="密码" prop="password" v-if="!isEdit">
          <a-input-password
              v-model="userForm.password"
              placeholder="请输入密码，6-18位，包含大小写字母和数字"
          />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'MyCorrect',
  data() {
    return {
      // 搜索参数
      searchParams: {
        username: '',
        realName: '',
        classId: '',
        state: '',
      },
      // 表格列定义
      columns: [
        {
          title: '考试名称',
          dataIndex: 'examName',
          key: 'examName',
        },
        {
          title: '考试开始时间',
          dataIndex: 'startTime',
          key: 'startTime',
          sorter: true,
        },
        {
          title: '考试结束时间',
          dataIndex: 'endTime',
          key: 'endTime',
          scopedSlots: { customRender: 'endTime' },
          sorter: true,
        },
        {
          title: '应批改',
          dataIndex: 'shouldCorrectNum',
          key: 'shouldCorrectNum',
          scopedSlots: { customRender: 'shouldCorrectNum' },
        },
        {
          title: '已批改',
          dataIndex: 'correctNum',
          key: 'correctNum',
          scopedSlots: { customRender: 'correctNum' },
        },
        {
          title: '考试状态',
          dataIndex: 'state',
          key: 'state',
          scopedSlots: { customRender: 'state' },
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: 280,
        },
      ],
      // 用户列表数据
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
      modalTitle: '新增用户',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      userForm: {
        id: undefined,
        username: '',
        realName: '',
        sex: 1,
        classId: '2', // 默认为教师角色
        state: 1,
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 3, max: 20, message: '账号长度应为3-20个字符', trigger: 'blur' }
        ],
        realName: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { max: 20, message: '姓名不能超过20个字符', trigger: 'blur' }
        ],
        sex: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        classId: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,18}$/, message: '密码须6-18位，包含大小写字母和数字', trigger: 'blur' }
        ]
      },
      // 添加角色列表数据
      classList: [],
    };
  },
  created() {
    this.fetchClassList(); // 获取班级下拉框
  },
  methods: {
    // 获取考试列表
    fetchList() {
      this.loading = true;

      const params = {
        classId:this.searchParams.classId,
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize
        }
      };

      axios.post(API.TEACHER_CORRECT.PAGE, params)
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
              this.$message.error(response.data?.msg || '获取列表失败');
            }
          })
          .catch(error => {
            console.error('获取列表失败:', error);
            this.$message.error('获取列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 获取班级
    fetchClassList() {
      axios.post(API.CLASS.GET_CLASS_LIST_FORTEACHER)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.classList = response.data.data || [];
              this.searchParams.classId = response.data.data[0].id;
              this.fetchList();
            } else {
              console.error('获取班级失败:', response.data?.msg || '未知错误');
            }
          })
          .catch(error => {
            console.error('获取班级出错:', error);
          });
    },

    // 考试状态
    getDifficultyName(level) {
      const levelMap = {
        '0': '待发布',
        '10': '未开始',
        '20': '考试进行中',
        '21': '考试已结束',
      };
      return levelMap[level] || '未知';
    },

    // 考试状态颜色
    getDifficultyColor(shape) {
      const colorMap = {
        '0': 'blue',
        '10': 'green',
        '20': 'orange',
        '21': 'purple',
      };
      return colorMap[shape] || 'default';
    },
    // 处理搜索
    handleSearch() {
      this.pagination.current = 1; // 重置到第一页
      this.fetchList();
    },

    stuList(record){
      this.$router.push({
        name: 'StudentList',
        params: { examId: record.examId,classId:this.searchParams.classId }
      });
    },

    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchList();
    },

    // 处理添加用户
    handleAdd() {
      this.modalTitle = '新增用户';
      this.isEdit = false;
      this.userForm = {
        username: '',
        realName: '',
        sex: 1,
        classId: '2', // 默认为教师角色
        state: 1,
        password: ''
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate();
        }
      });
    },

    // 处理编辑用户
    handleEdit(record) {
      this.modalTitle = '编辑用户';
      this.isEdit = true;
      this.userForm = {
        ...record,
        // 确保classId是字符串类型
        classId: record.classId ? record.classId.toString() : ''
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate();
        }
      });
    },

    // 处理删除用户
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该用户吗?',
        content: `用户名: ${record.username}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteUser(record.id);
        },
      });
    },

    // 调用删除用户API
    deleteUser(id) {
      this.loading = true;

      axios.post(API.TEACHER_CORRECT.DELETE, { ids: id.toString() })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除用户成功');
              this.fetchList();
            } else {
              this.$message.error(response.data?.msg || '删除用户失败');
            }
          })
          .catch(error => {
            console.error('删除用户失败:', error);
            this.$message.error('删除用户失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 调用修改用户状态API
    updateUserState(id, state) {
      this.loading = true;

      axios.post(API.TEACHER_CORRECT.UPDATE_STATE, {
        ids: id.toString(),
        state: state
      })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success(state === 1 ? '用户已启用' : '用户已禁用');
              this.fetchList();
            } else {
              this.$message.error(response.data?.msg || '操作失败');
            }
          })
          .catch(error => {
            console.error('修改用户状态失败:', error);
            this.$message.error('修改用户状态失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理模态框确认
    handleModalOk() {
      this.$refs.userForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;

          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.TEACHER_CORRECT.UPDATE : API.TEACHER_CORRECT.SAVE;
          const requestData = { ...this.userForm };

          // 编辑时不传密码字段
          if (this.isEdit) {
            delete requestData.password;
          }

          axios.post(apiUrl, requestData)
              .then(response => {
                if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                  this.$message.success(this.isEdit ? '编辑用户成功' : '新增用户成功');
                  this.modalVisible = false;
                  this.fetchList();
                } else {
                  this.$message.error(response.data?.msg || (this.isEdit ? '编辑用户失败' : '新增用户失败'));
                }
              })
              .catch(error => {
                console.error(this.isEdit ? '编辑用户失败:' : '新增用户失败:', error);
                this.$message.error(this.isEdit ? '编辑用户失败，请稍后重试' : '新增用户失败，请稍后重试');
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

    // 根据角色ID获取角色名称
    getRoleName(classId) {
      if (!classId) return '未分配';
      const role = this.classList.find(r => r.id.toString() === classId.toString());
      return role ? role.roleName : '未知角色';
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
