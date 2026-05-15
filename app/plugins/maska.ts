import * as maska from "maska"

export default defineNuxtPlugin((nuxtApp) => {
  // @ts-ignore
  const vMaska = maska.vMaska || (maska.default ? maska.default.vMaska : undefined)
  if (vMaska) {
    nuxtApp.vueApp.directive("maska", vMaska)
  }
})
