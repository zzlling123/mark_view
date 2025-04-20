<template>
  <div class="user-management">
    <h2>
      <img src="../../assets/back.png" width="25" style="cursor: pointer;" @click="goback"/>
      章节资源
    </h2>

    <div class="content-container">

      <!-- 表格区域 -->
      <a-card :bordered="false" style="margin-top: 16px">
        <div class="table-operations">

          <a-upload
              name="file"
              class="image-uploader"
              :show-upload-list="false"
              :before-upload="beforeUpload"
              @change="handleImageChange"
          >
            <div v-if="loading">
              <a-icon type="loading" />
            </div>
            <div v-else>
              <a-button type="primary">
                <a-icon type="plus" />新增资源
              </a-button>
            </div>
          </a-upload>

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
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDelete(record)">
                <a-icon type="delete" />删除
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
  name: 'ResourceList',
  data() {
    return {
      chapterId: null,
      // 搜索参数
      // 表格列定义
      columns: [
        {
          title: '资源名称',
          dataIndex: 'fileName',
          key: 'fileName',
        },
        {
          title: '资源类型',
          dataIndex: 'resourceType',
          key: 'resourceType',
          scopedSlots: { customRender: 'resourceType' },
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
    };
  },
  created() {
    this.chapterId = this.$route.params.chapterId;
    this.fetchUserList();
  },
  methods: {
    //返回上一页
    goback() {
      this.$router.go(-1);
    },
    // 获取资源
    fetchUserList() {
      this.loading = true;

      const params = {
        chapterId:this.chapterId,
        pageInfo: {
          page: this.pagination.current,
          pageSize: this.pagination.pageSize
        }
      };

      axios.post(API.RESOURCE.PAGE, params)
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

    // 进入章节信息
    chapterInfo(record) {
      this.$router.push({
        name: 'ChapterList',
        params: { examId: record.examId }
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
        title: '确定要删除该资源吗?',
        content: `资源名称: ${record.fileName}`,
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

      axios.post(`${API.RESOURCE.DELETE}${id}`)
          .then(response => {
            if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
              this.$message.success('删除资源成功');
              this.fetchUserList();
            } else {
              this.$message.error(response.data?.msg || '删除资源失败');
            }
          })
          .catch(error => {
            console.error('删除资源失败:', error);
            this.$message.error('删除资源失败，请稍后重试');
          })
          .finally(() => {
            this.loading = false;
          });
    },

    // 调用修改章节状态API
    updateUserState(id, state) {
      this.loading = true;

      axios.post(API.RESOURCE.UPDATE_STATE, {
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

    beforeUpload(file) {
      return false; // 不上传到服务器，在前端处理
    },
    handleImageChange(info) {
      if(info.file){
        const file = info.file;
        const form = new FormData();
        form.append('file', file);
        form.append('chapterId', this.chapterId);
        axios.post(API.RESOURCE.UPLOAD, form,  {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success(response.data.msg);
                this.fetchUserList();
              } else {
                this.$message.error(response.data?.msg || '操作失败');
              }
            })
            .catch(error => {
              this.$message.error('上传失败');
            })
            .finally(() => {
              this.loading = false;
            });
      }
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
