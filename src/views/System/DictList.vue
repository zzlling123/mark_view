<template>
  <div class="user-management">
    <h2>字典管理</h2>

    <div class="content-container">
      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
        <div class="table-operations">
          <a-button type="primary" @click="handleAdd">
            <a-icon type="plus" />新增字典
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
          <template slot="state" slot-scope="text">
            <a-badge :status="text === 1 ? 'success' : 'error'" />
            <span>{{ text === 1 ? '启用' : '禁用' }}</span>
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>
              <a-button
                  type="link"
                  size="small"
                  @click="() => handleChangeState(record)"
                  :style="{ color: record.state === 1 ? '#ff4d4f' : '#52c41a' }"
              >
                <a-icon :type="record.state === 1 ? 'stop' : 'check-circle'" />
                {{ record.state === 1 ? '禁用' : '启用' }}
              </a-button>
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑字典对话框 -->
    <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
        width="700px"
    >
      <a-form-model
          ref="systemForm"
          :model="systemForm"
          :rules="rules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="分类钮" prop="type">
          <a-input
              v-model="systemForm.type"
              placeholder="请输入分类钮"
          />
        </a-form-model-item>

        <a-form-model-item label="字典名称" prop="name">
          <a-input
              v-model="systemForm.name"
              placeholder="请输入字典名称"
          />
        </a-form-model-item>

        <a-form-model-item label="字典值" prop="value">
          <a-input
              v-model="systemForm.value"
              placeholder="请输入字典值"
          />
        </a-form-model-item>

<!--        <a-form-model-item label="状态" prop="state">-->
<!--          <a-radio-group v-model="systemForm.state">-->
<!--            <a-radio :value="1">启用</a-radio>-->
<!--            <a-radio :value="0">禁用</a-radio>-->
<!--          </a-radio-group>-->
<!--        </a-form-model-item>-->

      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios';
import API from '@/config/api';

export default {
  name: 'DictList',
  data() {
    return {
      // 搜索参数
      searchParams: {
        dictType: '',
        realName: '',
        roleId: '',
        state: '',
      },
      // 表格列定义
      columns: [
        {
          title: '分类钮',
          dataIndex: 'dictType',
          key: 'dictType',
        },
        {
          title: '字典名称',
          dataIndex: 'dictLabel',
          key: 'dictLabel',
        },
        {
          title: '字典值',
          dataIndex: 'dictValue',
          key: 'dictValue',
        },
        {
          title: '状态',
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
      // 字典列表数据
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
      modalTitle: '新增字典',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      systemForm: {
        id: undefined,
        type: '',
        name: '',
        value: ''
      },
      rules: {
        type: [
          { required: true, message: '请输入分类钮', trigger: 'blur' },
        ],
        name: [
          { required: true, message: '请输入字典名称', trigger: 'blur' },
        ],
        value: [
          { required: true, message: '请输入字典值', trigger: 'blur' }
        ],
      },
      // 添加角色列表数据
      roleList: [],
    };
  },
  created() {
    this.fetchList();
  },
  methods: {
    // 获取字典列表
    fetchList() {
      this.loading = true;

      const params = {
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize
        }
      };

      axios.post(API.DICT.PAGE, params)
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
              this.$message.error(response.data?.msg || '获取字典列表失败');
            }
          })
          .catch(error => {
            console.error('获取字典列表失败:', error);
            this.$message.error('获取字典列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchList();
    },

    // 处理添加字典
    handleAdd() {
      this.modalTitle = '新增字典';
      this.isEdit = false;
      this.systemForm = {
        type: '',
        name: '',
        value: '',
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.systemForm) {
          this.$refs.systemForm.clearValidate();
        }
      });
    },

    // 处理编辑字典
    handleEdit(record) {
      this.modalTitle = '编辑字典';
      this.isEdit = true;

      this.systemForm.id = record.id;
      this.systemForm.name = record.dictLabel;
      this.systemForm.type = record.dictType;
      this.systemForm.value = record.dictValue;

      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.systemForm) {
          this.$refs.systemForm.clearValidate();
        }
      });
    },

    // 处理删除字典
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该字典吗?',
        content: `字典名: ${record.dictType}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteUser(record.id);
        },
      });
    },

    // 调用删除字典API
    deleteUser(id) {
      this.loading = true;

      axios.post(API.DICT.DELETE, { ids: id.toString() })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除字典成功');
              this.fetchList();
            } else {
              this.$message.error(response.data?.msg || '删除字典失败');
            }
          })
          .catch(error => {
            console.error('删除字典失败:', error);
            this.$message.error('删除字典失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 修改字典状态
    handleChangeState(record) {
      const action = record.state === 1 ? '禁用' : '启用';

      this.$confirm({
        title: `确定要${action}该字典吗?`,
        content: `字典名: ${record.dictType}`,
        okText: '确定',
        okType: record.state === 1 ? 'danger' : 'primary',
        cancelText: '取消',
        onOk: () => {
          this.updateUserState(record.id, record.state === 1 ? 0 : 1);
        },
      });
    },

    // 调用修改字典状态API
    updateUserState(id, state) {
      this.loading = true;

      axios.post(API.DICT.UPDATE_STATE, {
        ids: id.toString(),
        state: state
      })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success(state === 1 ? '字典已启用' : '字典已禁用');
              this.fetchList();
            } else {
              this.$message.error(response.data?.msg || '操作失败');
            }
          })
          .catch(error => {
            console.error('修改字典状态失败:', error);
            this.$message.error('修改字典状态失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理模态框确认
    handleModalOk() {
      this.$refs.systemForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;

          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.DICT.UPDATE : API.DICT.SAVE;
          const requestData = { ...this.systemForm };


          axios.post(apiUrl, requestData)
              .then(response => {
                if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                  this.$message.success(this.isEdit ? '编辑字典成功' : '新增字典成功');
                  this.modalVisible = false;
                  this.fetchList();
                } else {
                  this.$message.error(response.data?.msg || (this.isEdit ? '编辑字典失败' : '新增字典失败'));
                }
              })
              .catch(error => {
                console.error(this.isEdit ? '编辑字典失败:' : '新增字典失败:', error);
                this.$message.error(this.isEdit ? '编辑字典失败，请稍后重试' : '新增字典失败，请稍后重试');
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
    getRoleName(roleId) {
      if (!roleId) return '未分配';
      const role = this.roleList.find(r => r.id.toString() === roleId.toString());
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
