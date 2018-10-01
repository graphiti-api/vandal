<template>
  <div class="graphici">
    <div v-if="schema">
      <div class="row">
        <div class="col-3 left-rail" :class="{ creating: creating }">
          <div class="card">
            <div class='selected-endpoint'>/employees#index</div>

            <resource-form :request="request" :resource="resource" />
          </div>
        </div>

        <div class="col-9 main">
          <form>
            <div class="row">
              <div class="col">
                <div class="container">
                  <input v-model="request.url" type="text" class="url form-control" placeholder="URL" />
                </div>
              </div>
            </div>
          </form>

          <div :class="'request card '+ currentTab.name+'' " >
            <div v-if="request && request.ready">
              <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs">
                  <li class="nav-item">
                    <a @click="tab(0)" class="nav-link" :class="{ active: currentTab.name == 'results' }">Results</a>
                  </li>
                  <li class="nav-item">
                    <a @click="tab(1)" class="nav-link" :class="{ active: currentTab.name == 'raw' }">Raw</a>
                  </li>
                  <li class="nav-item">
                    <a @click="tab(2)" class="nav-link" :class="{ active: currentTab.name == 'debug' }">Debug</a>
                  </li>
                </ul>
              </div>

              <div class="card-body">
                <div v-if="currentTab.name == 'raw'">
                  <pre v-highlightjs v-if="request.json">
                    <code class="json">{{ request.json }}</code>
                  </pre>
                </div>

                <div v-if="currentTab.name == 'results'">
                  <table class="table table-hover table-borderless">
                    <thead>
                      <th v-for="header in request.headers" :key="header">
                        {{ header }}
                      </th>
                    </thead>

                    <tbody>
                      <tr v-for="row in request.rows" :key="row.id">
                        <td v-for="(value, key) in row" :key="key">
                          {{ value }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div v-else class="no-request">
              Use the left side to configure and fire a request.
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      Loading...
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Schema } from '@/schema'
import { Request } from '@/request'
import ResourceForm from '@/components/ResourceForm.vue'

const tabs = [
  { name: 'results' },
  { name: 'raw' },
  { name: 'debug' }
]

export default Vue.extend({
  name: 'graphici',
  components: {
    ResourceForm
  },
  data() {
    return {
      endpoint: null as any,
      schema: null as any,
      request: null as null | Request,
      currentTab: tabs[0],
      creating: true
    }
  },
  created() {
    this.fetchData()
    let doneCreating = () => { this.creating = false }
    setTimeout(doneCreating, 1000)
  },
  computed: {
    resource() : any {
      return this.schema.resourceFor(this.endpoint)
    },
    requestPath() : any {
      return '/api/v1/employees.json'
    }
  },
  methods: {
    async fetchData() {
      this.endpoint = '/api/v1/employees#index' // todo get from routes
      let schemaJson = await (await fetch('/schema.json')).json()
      this.schema = new Schema(schemaJson)
      this.request = new Request(this.endpoint)
    },
    async fetch() {
      await this.request.fire()
    },
    tab(index: number) {
      console.log(index)
      this.currentTab = tabs[index]
    }
  }
});
</script>

<style lang="scss">
$success: lighten(green, 60%);
$danger: lighten(red, 20%);
$warning: lighten(yellow, 20%);

@keyframes slide-up {
    0% {
        opacity: 1;
        max-height: 500px;
    }
    100% {
        opacity: 0;
        max-height: 0;
        margin: 0;
        padding: 0;
    }
}

@keyframes slide-down {
    0% {
        opacity: 0;
        max-height: 0;
    }
    100% {
        opacity: 1;
        max-height: 500px;
    }
}

@keyframes slide-right {
    0% {
      left: -200px;
    }
    100% {
      left: 25px;
    }
}

.graphici {
  margin-top: 3rem;
}
.nav-link {
  cursor: pointer;
}

.url, .main .results {
  animation: slide-down 1s ease;
}

.left-rail {
  &.creating {
    .card {
      animation: slide-right 0.5s ease;
    }
  }

  .card {
    position: absolute;
    left: 25px;

    .form-group {
      animation: slide-down 1s ease;
    }

    .editingRelationship {
      form {
        .form-group.top-level:not(.relationships) {
          overflow: hidden;
          animation: slide-up 0.3s ease forwards;
        }

        .form-group.top-level.relationships {
          margin: 0;

          .relationship.selected {
            border-bottom: none;
          }

          .relationship:not(.selected) {
            display: none;
          }
        }
      }
    }
  }

  .section {
    margin-top: 2rem;
    border-top: 1px solid darken(grey, 25%);
    padding-top: 1rem;

    &.first {
      margin-top: 0;
    }
  }

  .selected-endpoint {
    margin-bottom: 2rem;
  }

  .config {
    .filter-name {
      margin-right: 5px;
    }

    button {
      float: right;
      margin-top: 2rem;
    }
  }

  .remove {
    float: right;
    margin-top: 3px;
    color: $danger !important;
    margin-right: 3px;
  }

  .relationships, .fields {
    .relationship, .field {
      border-bottom: 1px solid black;
      padding-bottom: 0.5rem;
      padding-top: 0.5rem;
      text-align: left;
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }

      &.selected {
        .name {
          color: $success;
        }
      }

      a {
        display: block;
      }

      .controls {
        float: right;

        a {
          display: inline;
          padding-left: 10px;

          &:first-child {
            padding-right: 10px;
          }

          &:nth-of-type(2) {
            border-left: 1px solid darken(grey, 20%);
          }
        }
      }

      .name {
        color: white;
        padding-right: 10px;
      }

      .badge {
        &:last-child {
          margin-left: 5px;
        }
      }
    }
  }
}

.main {
  .request {
    margin: 1rem;

    &.raw {
      .card-body {
        padding: 0;

        code {
          padding-left: 2rem;
        }
      }
    }

    .no-request {
      padding: 5rem;
    }

    .raw-response {
      text-align: left;
    }
  }
}

$darkCard: #5c666f;

pre {
  text-align: left;
  background-color: $darkCard;
  border: none;
  border-radius: 0;

  code.hljs {
    background-color: $darkCard;
    color: lighten(#DAE4F2, 5%);
    line-height: 20px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    &.coffeescript, &.cs, &.javascript, &.json {
      [class*=built_in] {
        color: lighten(#9AB4DB, 5%);
      }
      [class*=string] {
        color: lightgreen;
      }
      [class*=attribute] {
        color: white;
      }
      [class*=literal] {
        color: lighten(red, 30%);
      }
      [class*=c1] {
        color: #B4B4B4;
      }
      [class*=constant] {
        color: #FFDF9D;
      }
      [class*=nx], [class*=number] {
        color: darken(#9ECBEE, 5%);
      }
    }
  }
}
</style>