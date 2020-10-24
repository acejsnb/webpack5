import Vue from 'vue';

import router from './router';

import App from './App';


const isProd = process.env.NODE_ENV === 'production';

Vue.config.productionTip = isProd;

new Vue({
    router,
    render: (h) => h(App)
}).$mount('#app');
