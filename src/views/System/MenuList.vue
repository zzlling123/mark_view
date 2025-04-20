<template>
  <div class="user-management">
    <h2>菜单管理</h2>

    <div class="content-container">

      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
<!--        <div class="table-operations">-->
<!--          <a-button type="primary" @click="handleAdd">-->
<!--            <a-icon type="plus" />新增菜单-->
<!--          </a-button>-->
<!--        </div>-->

        <a-table
            :columns="columns"
            :dataSource="menuList"
            :rowKey="record => record.menuId"
            :loading="loading"
            childrenColumnName="childMenuList"
            @change="handleTableChange"
        >

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEdit(record)">
                <a-icon type="edit" />编辑
              </a-button>
<!--              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">-->
<!--                <a-icon type="delete" />删除-->
<!--              </a-button>-->
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加/编辑菜单对话框 -->
    <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        :confirmLoading="modalLoading"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
        width="700px"
    >
      <a-form-model
          ref="menuForm"
          :model="menuForm"
          :rules="rules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="菜单名称" prop="menuName">
          <a-input
              v-model="menuForm.menuName"
              placeholder="请输入菜单名称"
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
  name: 'MenuList',
  data() {
    return {
      // 搜索参数
      searchParams: {
        menuName: '',
        pid: '',
      },
      // 表格列定义
      columns: [
        {
          title: '菜单名称',
          dataIndex: 'menuName',
          key: 'menuName',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: 280,
        },
      ],
      // 菜单列表数据
      menuList: [],
      // 加载状态
      loading: false,

      // 模态框相关
      modalTitle: '新增菜单',
      modalVisible: false,
      modalLoading: false,
      isEdit: false,
      menuForm: {
        id: undefined,
        menuName: '',
        realName: '',
        sex: 1,
        roleId: '2', // 默认为教师角色
        state: 1,
        password: ''
      },
      rules: {
        menuName: [
          { required: true, message: '请输入菜单名称', trigger: 'blur' },
        ],
      },
    };
  },
  created() {
    this.fetchUserList();
  },
  methods: {
    // 获取菜单列表
    fetchUserList() {
      this.loading = true;

      axios.post(API.MENU.GET_ALL_LIST)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              const data = response.data;

              // 适配响应数据结构
              this.menuList = data.data || [];
            } else {
              this.$message.error(response.data?.msg || '获取菜单列表失败');
            }
          })
          .catch(error => {
            console.error('获取菜单列表失败:', error);
            this.$message.error('获取菜单列表失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理表格变化（排序、分页）
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.fetchUserList();
    },

    // 处理添加菜单
    handleAdd() {
      this.modalTitle = '新增菜单';
      this.isEdit = false;
      this.menuForm = {
        menuName: '',
        pid: '0'
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.menuForm) {
          this.$refs.menuForm.clearValidate();
        }
      });
    },

    // 处理编辑菜单
    handleEdit(record) {
      this.modalTitle = '编辑菜单';
      this.isEdit = true;
      this.menuForm = {
        ...record,
      };
      this.modalVisible = true;

      // 等待DOM更新后再重置验证
      this.$nextTick(() => {
        if (this.$refs.menuForm) {
          this.$refs.menuForm.clearValidate();
        }
      });
    },

    // 处理删除菜单
    handleDelete(record) {
      this.$confirm({
        title: '确定要删除该菜单吗?',
        content: `菜单名: ${record.menuName}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.deleteUser(record.id);
        },
      });
    },

    // 调用删除菜单API
    deleteUser(id) {
      this.loading = true;

      axios.post(API.MENU.DELETE, { ids: id.toString() })
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除菜单成功');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '删除菜单失败');
            }
          })
          .catch(error => {
            console.error('删除菜单失败:', error);
            this.$message.error('删除菜单失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 处理模态框确认
    handleModalOk() {
      this.$refs.menuForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;

          // 根据是否是编辑模式，调用不同的API
          const apiUrl = this.isEdit ? API.MENU.UPDATE : API.MENU.SAVE;
          const requestData = { ...this.menuForm };

          // 编辑时不传密码字段
          if (this.isEdit) {
            delete requestData.password;
          }

          axios.post(apiUrl, requestData)
              .then(response => {
                if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                  this.$message.success(this.isEdit ? '编辑菜单成功' : '新增菜单成功');
                  this.modalVisible = false;
                  this.fetchUserList();
                } else {
                  this.$message.error(response.data?.msg || (this.isEdit ? '编辑菜单失败' : '新增菜单失败'));
                }
              })
              .catch(error => {
                console.error(this.isEdit ? '编辑菜单失败:' : '新增菜单失败:', error);
                this.$message.error(this.isEdit ? '编辑菜单失败，请稍后重试' : '新增菜单失败，请稍后重试');
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
