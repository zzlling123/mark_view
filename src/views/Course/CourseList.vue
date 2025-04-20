<template>
  <div class="user-management">
    <h2>课程管理</h2>

    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="课程名称">
            <a-input
                v-model="searchParams.courseName"
                placeholder="请输入课程名称"
                allowClear
                @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="章节总数">
            <a-input
                v-model="searchParams.totalChapters"
                placeholder="请输入章节总数"
                allowClear
                @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="课程状态">
            <a-select
                v-model="searchParams.courseStatus"
                placeholder="请选择课程状态"
                style="width: 120px"
                allowClear
            >
              <a-select-option value="1">启用</a-select-option>
              <a-select-option value="0">禁用</a-select-option>
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
            <a-icon type="plus" />新增课程
          </a-button>
        </div>

        <a-table
            :columns="columns"
            :dataSource="userList"
            :rowKey="record => record.id"
            :pagination="pagination"
            :loading="loading"
            @change="handleTableChange"
        >
          <!-- 状态列自定义渲染 -->
          <template slot="courseStatus" slot-scope="text">
            <a-badge :status="text === 1 ? 'success' : 'error'" />
            <span>{{ text === 1 ? '启用' : '禁用' }}</span>
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>

              <a-button type="link" size="small" @click="() => chapterInfo(record)">
                <a-icon type="key" />章节管理
              </a-button>

              <a-button
                  type="link"
                  size="small"
                  @click="() => handleChangeState(record)"
                  :style="{ color: record.courseStatus === 1 ? '#ff4d4f' : '#52c41a' }"
              >
                <a-icon :type="record.courseStatus === 1 ? 'stop' : 'check-circle'" />
                {{ record.courseStatus === 1 ? '禁用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑课程对话框 -->
    <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
        width="700px"
    >
      <a-form-model
          ref="courseForm"
          :model="courseForm"
          :rules="rules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="课程名称" prop="courseName">
          <a-input
              v-model="courseForm.courseName"
              placeholder="请输入课程名称"
          />
        </a-form-model-item>
        <a-form-model-item label="课程状态" prop="courseStatus">
          <a-radio-group v-model="courseForm.courseStatus">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="章节总数" prop="totalChapters">
          <a-input
              v-model="courseForm.totalChapters"
              placeholder="请输入章节总数"
          />
        </a-form-model-item>

        <a-form-model-item label="备注" prop="remark">
          <a-input
              v-model="courseForm.remark"
              placeholder="请输入备注"
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
  name: 'CourseList',
  data() {
    return {
      // 搜索参数
      searchParams: {
        courseName: '',
        totalChapters: '',
        courseStatus: '',
      },
      // 表格列定义
      columns: [
        {
          title: '课程名称',
          dataIndex: 'courseName',
          key: 'courseName',
        },
        {
          title: '课程状态',
          dataIndex: 'courseStatus',
          key: 'courseStatus',
          scopedSlots: { customRender: 'courseStatus' },
        },
        {
          title: '章节总数',
          dataIndex: 'totalChapters',
          key: 'totalChapters',
          scopedSlots: { customRender: 'totalChapters' },
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: 280,
        },
      ],
      // 课程列表数据
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
      modalTitle: '新增课程',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      courseForm: {
        id: undefined,
        courseName: '',
        courseStatus: 1,
        remark:''
      },
      rules: {
        courseName: [
          { required: true, message: '请输入课程名称', trigger: 'blur' }
        ],
        totalChapters: [
          { required: true, message: '请输入章节总数', trigger: 'blur' }
        ],
        courseStatus:[
            { required: true, message: '请选择课程状态', trigger: 'change' }
        ],
      },
    };
  },
  created() {
    this.fetchUserList();
  },
  methods: {
    // 获取课程
    fetchUserList() {
      this.loading = true;

      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize
        }
      };

      // 添加搜索条件
      if (this.searchParams.courseName) {
        params.courseName = this.searchParams.courseName;
      }

      if (this.searchParams.totalChapters) {
        params.totalChapters = this.searchParams.totalChapters;
      }

      if (this.searchParams.courseStatus !== undefined) {
        params.courseStatus = this.searchParams.courseStatus;
      }

      axios.post(API.COURSE.PAGE, params)
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
              this.$message.error(response.data?.msg || '获取课程列表失败');
            }
          })
          .catch(error => {
            console.error('获取课程列表失败:', error);
            this.$message.error('获取课程列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 进入章节信息
    chapterInfo(record) {
      this.$router.push({
        name: 'ChapterList',
        params: { courseId: record.id }
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
        courseName: '',
        totalChapters: '',
        courseStatus: undefined
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

    // 处理添加课程
    handleAdd() {
      this.modalTitle = '新增课程';
      this.isEdit = false;
      this.courseForm = {
        courseName: '',
        totalChapters: '',
        courseStatus: 1,
        remark: ''
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.courseForm) {
          this.$refs.courseForm.clearValidate();
        }
      });
    },

    // 处理编辑课程
    handleEdit(record) {
      this.modalTitle = '编辑课程';
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

    // 处理删除课程
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该课程吗?',
        content: `课程名: ${record.courseName}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteUser(record.id);
        },
      });
    },

    // 调用删除课程API
    deleteUser(id) {
      this.loading = true;

      axios.post(`${API.COURSE.DELETE}${id}`)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除课程成功');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '删除课程失败');
            }
          })
          .catch(error => {
            console.error('删除课程失败:', error);
            this.$message.error('删除课程失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 修改课程状态
    handleChangeState(record) {
      const action = record.courseStatus === 1 ? '禁用' : '启用';

      this.$confirm({
        title: `确定要${action}该课程吗?`,
        content: `课程名称: ${record.courseName}`,
        okText: '确定',
        okType: record.courseStatus === 1 ? 'danger' : 'primary',
        cancelText: '取消',
        onOk: () => {
          this.updateUserState(record.id, record.courseStatus === 1 ? 0 : 1);
        },
      });
    },

    // 调用修改课程状态API
    updateUserState(id, state) {
      this.loading = true;

      axios.post(API.COURSE.UPDATE_STATE, {
        ids: id.toString(),
        state: state
      })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success(state === 1 ? '课程已启用' : '课程已禁用');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '操作失败');
            }
          })
          .catch(error => {
            console.error('修改课程状态失败:', error);
            this.$message.error('修改课程状态失败，请稍后重试');
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
          const apiUrl = this.isEdit ? API.COURSE.UPDATE : API.COURSE.SAVE;
          const requestData = { ...this.courseForm };

          // 编辑时不传密码字段
          if (this.isEdit) {
            delete requestData.password;
          }

          axios.post(apiUrl, requestData)
              .then(response => {
                if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                  this.$message.success(this.isEdit ? '编辑课程成功' : '新增课程成功');
                  this.modalVisible = false;
                  this.fetchUserList();
                } else {
                  this.$message.error(response.data?.msg || (this.isEdit ? '编辑课程失败' : '新增课程失败'));
                }
              })
              .catch(error => {
                console.error(this.isEdit ? '编辑课程失败:' : '新增课程失败:', error);
                this.$message.error(this.isEdit ? '编辑课程失败，请稍后重试' : '新增课程失败，请稍后重试');
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
