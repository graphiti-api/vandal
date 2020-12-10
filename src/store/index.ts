import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { MutationTree } from "vuex"
import SecureLS from 'secure-ls';
const ls = new SecureLS({ isCompression: false })

Vue.use(Vuex);

class State {
  token: string | null = null;
}

const mutations = <MutationTree<State>>{
  setToken (state, payload) {
    state.token = payload;
  }
};

export default new Vuex.Store({
  state: new State(),
  mutations: mutations,
  plugins: [
    createPersistedState({
      storage: {
        getItem: key => ls.get(key),
        setItem: (key, value) => ls.set(key, value),
        removeItem: key => ls.remove(key)
      }
    })
  ],
})

