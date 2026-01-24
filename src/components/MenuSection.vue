<script setup lang="ts">
interface MenuItem {
  name: string
  description: string
  price: string
}

const drinks: MenuItem[] = [
  { name: 'Classic Milk Tea', description: 'Creamy black tea with tapioca pearls', price: '$6' },
  { name: 'Taro Milk Tea', description: 'Sweet purple taro with tapioca pearls', price: '$7' },
  { name: 'Thai Tea', description: 'Traditional Thai iced tea with boba', price: '$6' },
  { name: 'Brown Sugar Boba', description: 'Fresh milk with caramelized brown sugar pearls', price: '$7' },
  { name: 'Matcha Latte', description: 'Premium matcha with your choice of milk', price: '$7' },
  { name: 'Fruit Tea', description: 'Mango, passion fruit, peach, or strawberry', price: '$6' },
  { name: 'Fresh Lemonade', description: 'House-squeezed with optional fruit flavors', price: '$5' },
]

const food: MenuItem[] = [
  { name: 'Bubble Waffle', description: 'Hong Kong style egg waffle with toppings', price: '$8' },
  { name: 'Waffle Sandwich', description: 'Bubble waffle with ice cream & fruit', price: '$10' },
  { name: 'Specialty Hotdog', description: 'Premium dog with house toppings', price: '$7' },
  { name: 'Macarons', description: 'Assorted flavors, crispy exterior, creamy filling', price: '$3' },
]
</script>

<template>
  <section id="menu" class="bg-neutral-50 px-4 py-12 md:py-20 md:px-8">
    <div class="max-w-2xl mx-auto">
      <h2 class="font-display text-3xl md:text-4xl font-semibold text-neutral-800 mb-8 text-center">Menu</h2>

      <h3 class="font-display text-lg font-semibold text-neutral-800 uppercase tracking-wider mb-4">Bubble Tea & Drinks</h3>
      <ul class="divide-y divide-neutral-200 mb-8">
        <li
          v-for="item in drinks"
          :key="item.name"
          class="py-4 flex justify-between items-start gap-4"
        >
          <div class="flex-1">
            <h4 class="font-body font-semibold text-neutral-800">{{ item.name }}</h4>
            <p class="font-body text-sm text-neutral-500 mt-1">{{ item.description }}</p>
          </div>
          <span class="font-body font-semibold text-neutral-900 whitespace-nowrap">{{ item.price }}</span>
        </li>
      </ul>

      <h3 class="font-display text-lg font-semibold text-neutral-800 uppercase tracking-wider mb-4">Food & Treats</h3>
      <ul class="divide-y divide-neutral-200">
        <li
          v-for="item in food"
          :key="item.name"
          class="py-4 flex justify-between items-start gap-4"
        >
          <div class="flex-1">
            <h4 class="font-body font-semibold text-neutral-800">{{ item.name }}</h4>
            <p class="font-body text-sm text-neutral-500 mt-1">{{ item.description }}</p>
          </div>
          <span class="font-body font-semibold text-neutral-900 whitespace-nowrap">{{ item.price }}</span>
        </li>
      </ul>

      <p class="font-body text-center text-neutral-500 text-sm mt-8">
        Add tapioca pearls or popping boba to any drink. Ask about today's specials!
      </p>
    </div>
  </section>
</template>
