<template>
  <div class="label-management">
    <h2>标签管理</h2>
    
    <div class="content-container">
      <!-- 标签列表 -->
      <a-card :bordered="false" title="标签列表">
        <div class="table-operations">
          <a-button type="primary" @click="handleAddLabel">
            <a-icon type="plus" />添加标签
          </a-button>
        </div>
        
        <a-table
          :columns="columns"
          :dataSource="labelList"
          :rowKey="record => record.id"
          :pagination="pagination"
          :loading="loading"
          @change="handleTableChange"
        >
          <template slot="action" slot-scope="text, record">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="() => handleEditLabel(record)">
                <a-icon type="edit" />编辑
              </a-button>
              <a-button type="link" size="small" style="color: #ff4d4f" @click="() => handleDeleteLabel(record)">
                <a-icon type="delete" />删除
              </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
    
    <!-- 添加标签对话框 -->
    <a-modal
      title="添加标签"
      :visible="addModalVisible"
      :confirmLoading="saveLoading"
      @ok="handleSaveLabel"
      @cancel="handleAddModalCancel"
      :getContainer="false"
      :maskClosable="false"
    >
      <a-form-model
        ref="labelForm"
        :model="labelForm"
        :rules="rules"
      >
        <a-form-model-item label="标签名称" prop="labelName">
          <a-input 
            v-model="labelForm.labelName" 
            placeholder="请输入标签名称"
            :maxLength="20"
            @pressEnter="handleSaveLabel"
          />
        </a-form-model-item>
        
        <div class="tag-tips">
          <h4>提示</h4>
          <p>标签用于对题目进行分类和筛选，便于后续查找和管理。</p>
          <p>添加标签前，请确认该标签尚未存在。</p>
        </div>
      </a-form-model>
    </a-modal>
    
    <!-- 编辑标签对话框 -->
    <a-modal
      title="编辑标签"
      :visible="modalVisible"
      :confirmLoading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :getContainer="false"
      :maskClosable="false"
    >
      <a-form-model
        ref="editForm"
        :model="editForm"
        :rules="rules"
      >
        <a-form-model-item label="标签名称" prop="labelName">
          <a-input 
            v-model="editForm.labelName" 
            placeholder="请输入标签名称"
            :maxLength="20"
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
  name: 'LabelManagement',
  data() {
    return {
      // 表格列定义
      columns: [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: '标签名称',
          dataIndex: 'labelName',
          key: 'labelName',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          key: 'createTime',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: 150,
        }
      ],
      // 标签列表数据
      labelList: [],
      // 分页信息
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: total => `共 ${total} 条`,
      },
      // 加载状态
      loading: false,
      
      // 添加标签表单
      labelForm: {
        labelName: '',
      },
      saveLoading: false,
      addModalVisible: false, // 添加标签对话框显示状态
      
      // 编辑标签相关
      modalVisible: false,
      modalLoading: false,
      editForm: {
        id: undefined,
        labelName: '',
      },
      
      // 表单验证规则
      rules: {
        labelName: [
          { required: true, message: '请输入标签名称', trigger: 'blur' },
          { max: 20, message: '标签名称不能超过20个字符', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.fetchLabelList();
  },
  methods: {
    // 获取标签列表
    fetchLabelList() {
      this.loading = true;
      
      // 由于后端API可能没有提供获取标签列表的接口，这里模拟一些数据
      setTimeout(() => {
        this.labelList = [
          { id: 1, labelName: '基础', createTime: '2025-03-22 15:30:00' },
          { id: 2, labelName: '进阶', createTime: '2025-03-22 15:31:00' },
          { id: 3, labelName: '高级', createTime: '2025-03-22 15:32:00' },
          { id: 4, labelName: '实战', createTime: '2025-03-22 15:33:00' },
        ];
        
        this.pagination.total = this.labelList.length;
        this.loading = false;
      }, 500);
    },
    
    // 处理表格变化
    handleTableChange(pagination) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
    },
    
    // 处理保存标签
    handleSaveLabel() {
      this.$refs.labelForm.validate(valid => {
        if (valid) {
          this.saveLoading = true;
          
          axios.post(API.LABEL.SAVE, null, {
            params: { 
              labelName: this.labelForm.labelName 
            }
          })
            .then(response => {
              if (response.data && (response.data.state === 'ok' || response.data.code === 200)) {
                this.$message.success('标签添加成功');
                this.labelForm.labelName = ''; // 清空表单
                this.addModalVisible = false; // 关闭模态框
                this.fetchLabelList(); // 重新加载列表
              } else {
                this.$message.error('标签添加失败：' + (response.data.msg || '未知错误'));
              }
            })
            .catch(error => {
              console.error('标签添加失败:', error);
              this.$message.error('标签添加失败，请稍后重试');
            })
            .finally(() => {
              this.saveLoading = false;
            });
        }
      });
    },
    
    // 处理添加标签（打开添加模态框）
    handleAddLabel() {
      this.labelForm.labelName = '';
      this.addModalVisible = true;
      
      // 等待模态框渲染后聚焦到输入框
      this.$nextTick(() => {
        const input = document.querySelector('.label-management .ant-modal input');
        if (input) input.focus();
      });
    },
    
    // 处理添加模态框取消
    handleAddModalCancel() {
      this.addModalVisible = false;
    },
    
    // 处理编辑标签
    handleEditLabel(record) {
      this.editForm = { ...record };
      this.modalVisible = true;
    },
    
    // 处理删除标签
    handleDeleteLabel(record) {
      this.$confirm({
        title: '确定要删除这个标签吗?',
        content: `标签名称: ${record.labelName}`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          // 注意：后端API中可能没有提供删除标签的接口
          this.$message.info('删除标签功能待实现');
        },
      });
    },
    
    // 处理模态框确认
    handleModalOk() {
      this.$refs.editForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          
          // 注意：后端API中可能没有提供更新标签的接口
          setTimeout(() => {
            this.$message.info('编辑标签功能待实现');
            this.modalLoading = false;
            this.modalVisible = false;
          }, 500);
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
.label-management {
  padding: 20px;
}

.content-container {
  margin-top: 20px;
}

.table-operations {
  margin-bottom: 16px;
  text-align: right;
}

.action-buttons button {
  padding: 0 8px;
}

.tag-tips {
  color: #666;
  margin-top: 16px;
  border-top: 1px dashed #eee;
  padding-top: 12px;
}

.tag-tips h4 {
  margin-bottom: 8px;
  color: #1890ff;
}

.tag-tips p {
  margin-bottom: 8px;
}
</style> 