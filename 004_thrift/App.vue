<template>
  <div>
    <section class="artical-list">
      <ul>
        <li
          v-for="(item, index) in list"
          :key="index">
          <p>{{item.content}}</p>
          <p>作者： {{item.author}}, 当前状态：{{item.status | status}}</p>
          <button @click="doneArtical(item)">设置为已阅</button>
          <button @click="deleteArtical(item)">删除</button>
        </li>
      </ul>
    </section>

    <section class="form-data">
      <textarea name="artical" v-model="artical" cols="30" rows="10"></textarea>
      <input type="text" name="author" v-model="author"/>
      <button @click="postArtical">提交</button>
    </section>
  
  </div>
</template>

<script>
/* eslint-disable */
export default {
  data () {
    return {
      list: [],
      artical: '',
      author: '',
    }
  },
  created () {
    this.init()
  },
  filters: {
    status (value) {
      const status = ['无', '正常', '已阅', '删除']
      return status[value]
    },
  },
  methods: {
    init () {
      const transport = new Thrift.Transport('http://localhost:7878')
      const protocol = new Thrift.Protocol(transport)
      const client = new TodoClient(protocol)
      this.client = client
      this.getList()
    },
    getList () {
      this.client.getTodoList((result) => {
        this.list = result
      })
    },
    postArtical () {
      const result = new PostItem()
      result.content = this.artical
      result.author = this.author

      this.client.postTodo(result, (result) => {
        this.getList()
      })
    },
    doneArtical (item) {
      this.client.doneArtical(item.id, (result) => {
        if (result instanceof Thrift.TApplicationException) {
          alert(result.message)
          return
        }
        this.getList()
      })
    },
    deleteArtical (item) {
      this.client.deleteArtical(item.id, (result) => {
        if (result instanceof Thrift.TApplicationException) {
          alert(result.message)
          return
        }
        this.getList()
      })
    },
  },
}
</script>

<style>

</style>
