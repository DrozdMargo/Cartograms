<template>
    <select :id="controlId"
            :name="name"
            class="form-control"
            @change="emitModel"
            :disabled="disabled">
        <option v-for="option in  selectOptions"
                :key="getOptionValue(option)"
                :value="getOptionValue(option)"
                :selected="isSelected(option)">
            {{ getOptionLabel(option) }}
        </option>
    </select>
</template>

<script>
import find from 'lodash/find'

export default {
  name: 'simple-select',
  props: [ 'options', 'labelColumn', 'valueColumn', 'controlId', 'name', 'disabled', 'prompt', 'value', ],
  computed: {
    selectOptions () {
      const options = this.options.concat([])
      if (this.prompt) {
        options.unshift({
          [this.labelColumn]: this.prompt,
          [this.valueColumn]: '',
        })
      }
      return options
    },
  },
  methods: {
    getOptionLabel (option) {
      return option[this.labelColumn]
    },
    getOptionValue (option) {
      return option[this.valueColumn]
    },
    emitModel (event) {
      const val = find(this.options, opt => String(opt[this.valueColumn]) === event.target.value)
      this.$emit('input', val)
      this.$emit('change', val)
    },
    isSelected (option) {
      return this.value && this.value[this.valueColumn] === option[this.valueColumn]
    },
  },
}
</script>
