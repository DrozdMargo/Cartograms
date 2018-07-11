<template>
    <!-- eslint-disable -->
    <div>
        <div :key="itemKey" class="menu-item" v-for="(item, itemKey) in items">
            <slot name="header">
                <div class="header" @click="toggleMenu">
                    {{ item.name }}
                </div>
            </slot>

            <slot name="body">
                <div class="children-wrapper" v-show="menuOpen">
                    <ul class="children-menu" transition="slide-in-out">
                        <li><a :key="childKey" v-for="(child, childKey) in childItems">{{ child.name }}</a></li>
                    </ul>
                </div>
            </slot>
        </div>
    </div>

</template>

<script>
    /* eslint-disable */
    export default {
        name: 'CollapseMenu',
        props: {
            items: {
                type: [Array, Object],
                default: false
            },
            childItems: {
                type: [Array, Object, Boolean],
                default: false
            }
        },
        data: () => ({
            menuOpen: false,
            height: 0
        }),
        ready: function () {
            this.height = this.menuItems.length * 48;
        },
        methods: {
            toggleMenu: function () {
                this.menuOpen = !this.menuOpen;
            }
        }
    }
</script>

<style lang="scss">
    * {
        box-sizing: border-box;
    }

    .menu-item {
        width: 100%;
        background: #FFF;
        margin: 20px auto;
    }

    .header {
        font-size: 14px;
        padding: 10px;
        background: #EEE;
    }

    .children-wrapper {
        overflow: hidden;
    }

    .children-menu {
        padding: 0;
        margin: 0;
        list-style: none;
        display: flex;
        flex-direction: column;

        a {
            display: flex;
            align-items: center;
            height: 48px;
            width: 100%;
            padding-top: 10px;
            padding-bottom: 10px;
            padding-left: 32px;
            text-decoration: none;
        }
    }

</style>
