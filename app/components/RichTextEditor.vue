<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

const props = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] p-4',
    },
  },
})

watch(() => props.modelValue, (newVal) => {
  if (editor.value && editor.value.getHTML() !== newVal) {
    editor.value.commands.setContent(newVal, { emitUpdate: false })
  }
})
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-sm font-bold text-gray-700">{{ label }}</label>
    <div class="border rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 transition shadow-sm">
      <!-- Toolbar -->
      <div v-if="editor" class="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button 
          @click.prevent="editor.chain().focus().toggleBold().run()"
          :class="{ 'bg-blue-100 text-blue-600': editor.isActive('bold'), 'hover:bg-gray-200': !editor.isActive('bold') }"
          class="p-2 rounded transition" title="Negrito"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button 
          @click.prevent="editor.chain().focus().toggleItalic().run()"
          :class="{ 'bg-blue-100 text-blue-600': editor.isActive('italic'), 'hover:bg-gray-200': !editor.isActive('italic') }"
          class="p-2 rounded transition" title="Itálico"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 italic" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 20l4-16m4 0h-4m-4 16h-4" />
          </svg>
        </button>
        <button 
          @click.prevent="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'bg-blue-100 text-blue-600': editor.isActive('underline'), 'hover:bg-gray-200': !editor.isActive('underline') }"
          class="p-2 rounded transition" title="Sublinhado"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 4v7a4 4 0 01-8 0V4M6 20h12" />
          </svg>
        </button>
        <div class="w-px h-6 bg-gray-200 mx-1"></div>
        <button 
          @click.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'bg-blue-100 text-blue-600': editor.isActive('heading', { level: 2 }), 'hover:bg-gray-200': !editor.isActive('heading', { level: 2 }) }"
          class="p-2 rounded transition text-xs font-bold"
        >
          H2
        </button>
        <button 
          @click.prevent="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'bg-blue-100 text-blue-600': editor.isActive('bulletList'), 'hover:bg-gray-200': !editor.isActive('bulletList') }"
          class="p-2 rounded transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style>
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
