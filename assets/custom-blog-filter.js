class BlogFilterGrid extends HTMLElement {
  constructor() {
    super();
    this.postsPerPage = parseInt(this.dataset.postsPerPage) || 9;
    this.currentPage = 1;
    this.currentTag = 'all';
    this.currentSearch = '';

    this.grid = this.querySelector('.blog-grid');
    this.allPosts = Array.from(this.querySelectorAll('.blog-card'));
    this.filterBtns = this.querySelectorAll('.filter-btn');
    this.searchInput = this.querySelector('.blog-search-input');
    this.searchClear = this.querySelector('.blog-search-clear');
    this.suggestionBox = this.querySelector('.suggestion-box');
    this.totalCountSpan = this.querySelector('.blog-total-count span');
    this.paginationCenter = this.querySelector('.blog-pagination-center');
    this.paginationJump = this.querySelector('.blog-pagination-jump');

    this.allPosts.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
    this.filteredPosts = [...this.allPosts];
  }

  connectedCallback() {
    this.initFuseSearch();
    this.syncStateWithURL();
    this.attachEventListeners();
    this.render();
  }

  initFuseSearch() {
    const searchData = this.allPosts.map(post => ({
      element: post,
      title: post.querySelector('.blog-card__title').textContent.trim()
    }));
    if (typeof Fuse !== 'undefined') {
      this.fuse = new Fuse(searchData, { keys: ['title'], threshold: 0.3 });
    }
  }

  syncStateWithURL() {
    const params = new URLSearchParams(window.location.search);
    this.currentPage = parseInt(params.get('page')) || 1;
    this.currentTag = (params.get('tag') || 'all').toLowerCase();
    this.currentSearch = params.get('q') || '';
    if (this.currentSearch) {
        this.searchInput.value = this.currentSearch;
        this.searchClear.style.display = 'flex';
    }
    this.updateActiveButton();
  }

  updateURLParams() {
    const url = new URL(window.location.href);
    url.searchParams.set('page', this.currentPage);
    url.searchParams.set('tag', this.currentTag);
    if (this.currentSearch) url.searchParams.set('q', this.currentSearch);
    else url.searchParams.delete('q');
    history.replaceState({}, '', url);
  }

  attachEventListeners() {
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTag = e.target.dataset.tag.toLowerCase();
        this.currentPage = 1;
        this.updateActiveButton();
        this.updateURLParams();
        this.render();
      });
    });

    this.searchInput.addEventListener('input', (e) => {
      this.currentSearch = e.target.value.trim();
      this.currentPage = 1;
      this.searchClear.style.display = this.currentSearch ? 'flex' : 'none';
      this.handleSuggestions(this.currentSearch);
      this.updateURLParams();
      this.render();
    });

    // Clear Search Event
    this.searchClear.addEventListener('click', () => {
        this.searchInput.value = '';
        this.currentSearch = '';
        this.searchClear.style.display = 'none';
        this.suggestionBox.style.display = 'none';
        this.currentPage = 1;
        this.updateURLParams();
        this.render();
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.suggestionBox.contains(e.target)) {
        this.suggestionBox.style.display = 'none';
      }
    });
  }

  updateActiveButton() {
    this.filterBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(this.filterBtns).find(btn => btn.dataset.tag.toLowerCase() === this.currentTag);
    if (activeBtn) activeBtn.classList.add('active');
  }

  handleSuggestions(query) {
    if (!query || query.length < 2 || !this.fuse) {
      this.suggestionBox.style.display = 'none';
      return;
    }
    const results = this.fuse.search(query, { limit: 5 });
    this.suggestionBox.innerHTML = '';
    if (results.length > 0) {
      results.forEach(res => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = res.item.title;
        item.onclick = () => {
          this.searchInput.value = res.item.title;
          this.currentSearch = res.item.title;
          this.suggestionBox.style.display = 'none';
          this.currentPage = 1;
          this.updateURLParams();
          this.render();
        };
        this.suggestionBox.appendChild(item);
      });
      this.suggestionBox.style.display = 'block';
    }
  }

filterLogic() {
    let posts = this.allPosts;
    
    // Standard exact keyword matching (ignores case)
    if (this.currentSearch) {
      const query = this.currentSearch.toLowerCase();
      posts = posts.filter(post => {
        const title = post.querySelector('.blog-card__title').textContent.toLowerCase();
        return title.includes(query);
      });
      
      // Sort the exact matches by date
      posts.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
    }
    
    // Filter by Tag
    if (this.currentTag !== 'all') {
      posts = posts.filter(post => (post.dataset.tags || '').toLowerCase().includes(this.currentTag));
    }
    
    this.filteredPosts = posts;
    this.totalCountSpan.textContent = this.filteredPosts.length;
  }

renderPagination() {
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    
    // We need to target the whole bottom bar, not just the center, 
    // to handle the arrows correctly.
    const bottomBar = this.querySelector('.blog-bottom-bar');
    const paginationWrapper = this.querySelector('.blog-pagination-wrapper');
    const prevArrow = this.querySelector('.prev-arrow');
    const nextArrow = this.querySelector('.next-arrow');
    
    this.paginationCenter.innerHTML = '';
    this.paginationJump.innerHTML = '';
    
    if (totalPages <= 1) {
      bottomBar.style.display = 'none';
      return;
    } else {
      bottomBar.style.display = 'flex'; // Make sure this matches the inline style we set
    }

    // Handle Left/Right Arrow states and clicks
    if (prevArrow && nextArrow) {
        // Disable/Enable styling based on current page
        prevArrow.style.opacity = this.currentPage === 1 ? '0.3' : '1';
        prevArrow.style.pointerEvents = this.currentPage === 1 ? 'none' : 'auto';
        
        nextArrow.style.opacity = this.currentPage === totalPages ? '0.3' : '1';
        nextArrow.style.pointerEvents = this.currentPage === totalPages ? 'none' : 'auto';

        // Remove old event listeners to prevent duplicates
        const newPrevArrow = prevArrow.cloneNode(true);
        const newNextArrow = nextArrow.cloneNode(true);
        prevArrow.replaceWith(newPrevArrow);
        nextArrow.replaceWith(newNextArrow);

        // Add new click events
        newPrevArrow.addEventListener('click', () => {
            if (this.currentPage > 1) this.changePage(this.currentPage - 1);
        });
        
        newNextArrow.addEventListener('click', () => {
            if (this.currentPage < totalPages) this.changePage(this.currentPage + 1);
        });
    }

    const createBtn = (page) => {
      const btn = document.createElement('button');
      btn.className = `page-num ${page === this.currentPage ? 'active' : ''}`;
      btn.textContent = page;
      btn.onclick = () => this.changePage(page);
      return btn;
    };

    const createEllipsis = () => {
      const span = document.createElement('span');
      span.className = 'page-ellipsis';
      span.textContent = '...';
      return span;
    };

    // SMART TRUNCATION LOGIC
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        this.paginationCenter.appendChild(createBtn(i));
      }
    } else {
      this.paginationCenter.appendChild(createBtn(1));

      if (this.currentPage > 3) {
        this.paginationCenter.appendChild(createEllipsis());
      }

      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        this.paginationCenter.appendChild(createBtn(i));
      }

      if (this.currentPage < totalPages - 2) {
        this.paginationCenter.appendChild(createEllipsis());
      }

      // If we aren't already rendering the last page, render it
      if (end < totalPages) {
         this.paginationCenter.appendChild(createBtn(totalPages));
      }
    }

    // Render Jump Input (matching your screenshot layout)
    this.paginationJump.innerHTML = `
      <label for="page-jump-input" style="font-weight: 500;">Page</label>
      <input type="number" id="page-jump-input" class="jump-input" min="1" max="${totalPages}" style="width: 50px; height: 36px; text-align: center; border: 1px solid #E1E3E5; border-radius: 4px; appearance: textfield;">
      <button class="jump-btn btn-go" style="background-color: #2b6cb0; color: white; border: none; border-radius: 4px; padding: 0 15px; height: 36px; cursor: pointer; font-weight: 600;">Go</button>
    `;

    const jumpInput = this.paginationJump.querySelector('.jump-input');
    const jumpBtn = this.paginationJump.querySelector('.jump-btn');

    const handleJump = () => {
      const val = parseInt(jumpInput.value);
      if (val >= 1 && val <= totalPages) {
          this.changePage(val);
      } else {
          // Reset input if they type a number out of bounds
          jumpInput.value = '';
      }
    };

    jumpBtn.onclick = handleJump;

    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleJump();
      }
    });
  }
  changePage(num) {
    this.currentPage = num;
    this.updateURLParams();
    this.render();
    window.scrollTo({ top: this.offsetTop - 100, behavior: 'smooth' });
  }

  render() {
    this.filterLogic();
    const start = (this.currentPage - 1) * this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(start, start + this.postsPerPage);
    this.grid.innerHTML = postsToShow.length ? '' : '<p>No blogs found.</p>';
    postsToShow.forEach(post => this.grid.appendChild(post));
    this.renderPagination();
  }
}

customElements.define('blog-filter-grid', BlogFilterGrid);