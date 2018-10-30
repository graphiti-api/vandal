<template>
  <div class="demo">
    <div v-if="response">
      {{ response.data.first_name }}

      <br />
      <br />
      <br />

      <div v-for="team in response.data.teams" :key="team.id">
        <div v-for="e in team.employees" :key="e.id">
          {{ e.first_name }}

          <div v-for="bug in e.tasks" :key="bug.id">
            {{ bug.title }}
          </div>
          <br />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'demo',
  data() {
    return {
      response: {} as any
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      let url = 'http://localhost:8080/api/v1/employees/1.json?filter[teams.employees.id][not_eq]=1&filter[teams.employees.tasks.type][eq]=Bug&include=teams.employees.tasks'
      this.response = await (await fetch(url)).json()
    }
  }
});
</script>

<style lang="scss" scoped>
.demo {
  margin-top: 100px;
}
</style>