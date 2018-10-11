<template>
  <div class="graphici" :class="{ creating: creating }">
    <div v-if="schema">
      <div class="row">
        <div class="col-3 left-rail">
          <div class="card">
            <div class='selected-endpoint'>
              <span>/employees#index</span>
              <button @click="fetch()" type="submit" class="float-right btn btn-primary">Go &raquo;</button>
            </div>

            <resource-form :query="query" @submit="fetch" :schema="schema" :depth="0"/>
          </div>
        </div>

        <div class="col-9 main">
          <form class="query clearfix">
            <input v-model="query.url" type="text" class="form-control url" placeholder="URL" />
            <input id="copy-url" type="hidden" :value="schema.json.base_url + query.url" />

            <div class="btn-group url-controls">
              <a @click="copyUrl()" class="btn btn-secondary">Copy</a>
              <a :href="query.url" target="_blank" class="btn btn-secondary">Tab</a>
              <a class="btn btn-secondary">Curl</a>
            </div>
          </form>

          <div :class="'request card '+ currentTab.name+'' " >
            <div v-if="query && query.ready">
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
                  <pre v-highlightjs v-if="query.json">
                    <code class="json">{{ query.json }}</code>
                  </pre>
                </div>

                <div class="loading-area" v-if="currentTab.name == 'results'" :class="{ 'loading-area-active': isLoading }">
                  <table class="results table table-hover table-borderless">
                    <thead>
                      <th v-for="header in query.headers" :key="header">
                        {{ header }}
                      </th>
                    </thead>

                    <tbody>
                      <tr v-for="row in query.rows" :key="row.id.value">
                        <td v-for="(config, key) in row" :key="key" :class="{ ['type-'+config.type]: true }">
                          <span v-if="config.type == 'datetime'">
                            {{ config.value | dateTimeType }}
                          </span>
                          <span v-else-if="config.type == 'date'">
                            {{ config.value | dateType }}
                          </span>
                          <span v-else>
                            {{ config.value }}
                          </span>
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
import { Query } from '@/query'
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
      query: null as null | Query,
      currentTab: tabs[0],
      creating: true,
      isLoading: false
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
    }
  },
  methods: {
    async fetchData() {
      this.endpoint = '/api/v1/employees#index' // todo get from routes
      let schemaJson = await (await fetch('/schema.json')).json()
      this.schema = new Schema(schemaJson)
      let resource = this.schema.resourceFor(this.endpoint)
      this.query = new Query(resource, this.endpoint)
    },
    async fetch() {
      this.isLoading = true
      let then = Date.now()
      await this.query.fire()
      let now = Date.now()
      // Force min of 100ms
      await this.stall(100-(now - then))
      this.isLoading = false
    },
    tab(index: number) {
      this.currentTab = tabs[index]
    },
    copyUrl() {
      navigator.clipboard.writeText(`${this.schema.json.base_url}${this.query.url}`)
      // let copyText = document.getElementById("copy-url") as any;
      // console.log(copyText)
      // copyText.select()
      // document.execCommand("copy");
    },
    stall(stallTime = 3000) {
      return new Promise(resolve => setTimeout(resolve, stallTime));
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
        margin: 0 !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        overflow: hidden;
    }
}

@keyframes slide-down {
    0% {
        opacity: 0;
        max-height: 0;
    }
    99% {
        opacity: 1;
        max-height: 500px;
    }
    100% {
        opacity: 1;
        max-height: 1000px;
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

@keyframes move-down-query {
    0% {
        transform: translateY(-200px);

        .url-controls {
          right: 0;
        }
    }
    100% {
        transform: translateY(0px);

        .url-controls {
          right: 2rem;
        }
    }
}

@keyframes move-up-request {
    0% {
        transform: translateY(500px);
    }
    100% {
        transform: translateY(0px);
    }
}

.graphici {
  margin-top: 3rem;
}
.nav-link {
  cursor: pointer;
}

.creating {
  .left-rail .card {
    animation: slide-right 0.7s ease forwards;
  }

  .main .query {
    animation: move-down-query 0.5s ease forwards;
  }

  .main .request {
    animation: move-up-request 0.5s ease forwards;
  }
}

.left-rail {
  .card {
    position: absolute;
    left: 25px;
  }

  .selected-endpoint {
    margin-bottom: 2rem;
  }
}

.main {
  padding-left: 1rem;
  padding-right: 2rem;

  .query {
    position: relative;

    .url {
      float: left;
      margin: 0 !important;
    }

    .url-controls {
      position: absolute;
      right: 0;
      border-radius: 0;

      a:focus {
        box-shadow: none;
      }

      a:first-child {
        border-radius: 0;
      }
    }
  }

  .request {
    margin-top: 1rem;

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

.results {
  .type-integer {
    color: #90CAF9;
  }

  .type-string {
    color: $success;
  }

  .type-boolean {
    color: #E040FB;
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