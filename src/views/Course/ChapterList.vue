<template>
  <div class="user-management">
    <h2>
      <img src="../../assets/back.png" width="25" style="cursor: pointer;" @click="goback"/>
      章节管理
    </h2>

    <div class="content-container">
      <!-- 搜索区域 -->
      <a-card :bordered="false" class="search-card">
        <a-form layout="inline">
          <a-form-item label="章节名称">
            <a-input
                v-model="searchParams.chapterTitle"
                placeholder="请输入章节名称"
                allowClear
                @pressEnter="handleSearch"
            />
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
            <a-icon type="plus" />新增章节
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
                <a-icon type="key" />章节资源
              </a-button>

              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑章节对话框 -->
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
        <a-form-model-item label="章节名称" prop="chapterTitle">
          <a-input
              v-model="courseForm.chapterTitle"
              placeholder="请输入章节名称"
          />
        </a-form-model-item>
        <a-form-model-item label="章节排序" prop="">
          <a-input
              v-model="courseForm.chapterOrder"
              placeholder="请输入章节排序"
          />
        </a-form-model-item>
        <a-form-model-item label="章节描述" prop="">
          <a-input
              v-model="courseForm.description"
              placeholder="请输入章节描述"
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
  name: 'ChapterList',
  data() {
    return {
      courseId: null,
      // 搜索参数
      searchParams: {
        chapterTitle: '',
        chapterOrder:''
      },
      // 表格列定义
      columns: [
        {
          title: '章节名称',
          dataIndex: 'chapterTitle',
          key: 'chapterTitle',
        },
        {
          title: '章节排序',
          dataIndex: 'chapterOrder',
          key: 'chapterOrder',
          scopedSlots: { customRender: 'chapterOrder' },
        },
        {
          title: '章节描述',
          dataIndex: 'description',
          key: 'description',
          scopedSlots: { customRender: 'description' },
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

    this.courseId = this.$route.params.courseId;
    this.fetchUserList();
  },
  methods: {
    //返回上一页
    goback() {
      this.$router.go(-1);
    },
    // 获取章节
    fetchUserList() {
      this.loading = true;

      const params = {
        courseId: this.courseId,
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

      axios.post(API.CHAPTER.PAGE, params)
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
              this.$message.error(response.data?.msg || '获取章节列表失败');
            }
          })
          .catch(error => {
            console.error('获取章节列表失败:', error);
            this.$message.error('获取章节列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 章节资源
    chapterInfo(record) {
      this.$router.push({
        name: 'ResourceList',
        params: { chapterId: record.id }
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

      axios.post(`${API.CHAPTER.DELETE}${id}`)
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

      axios.post(API.CHAPTER.UPDATE_STATE, {
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
          const apiUrl = this.isEdit ? API.CHAPTER.UPDATE : API.CHAPTER.SAVE;
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
