import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-[#1E2347] text-[#C5CADF] py-10 mt-16">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <p class="font-serif text-2xl mb-2">Rise Bakery</p>
        <p class="text-sm text-[#7279A5]">Handcrafted with love · Pickup orders only</p>
        <p class="text-xs text-[#7279A5] mt-4">&copy; {{ year }} Rise Bakery. All rights reserved.</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
