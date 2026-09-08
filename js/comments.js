/**
 * KejaMarket - Facebook-Style Live Public Comments & Community Discussion Engine
 * Allows anyone to post live comments, react with emojis (👍 ❤️ 🔥 👏), and reply in threads.
 */

class CommentManager {
  constructor() {
    this.comments = {};
    this.activeFilter = 'top'; // 'top' | 'recent'
    this.initDefaultComments();
  }

  initDefaultComments() {
    // Seed authentic Facebook-style property discussions
    this.comments = {
      'prop-nrb-001': [
        {
          id: 'comm-101',
          author: 'Faith Mwende',
          avatar: 'FM',
          avatarBg: '#3b82f6',
          text: 'Is viewing free this weekend? I work in Westlands and Ruaka is perfect for my commute via Bypass.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          reactions: { likes: 7, loves: 3, fire: 2, clap: 1 },
          userReactions: {},
          replies: [
            {
              id: 'rep-101-1',
              author: 'James Mwangi (Landlord)',
              isLandlord: true,
              text: 'Hello Faith! Yes, viewing is 100% free anytime between 9am and 6pm. The caretaker is on-site at the gate.',
              createdAt: new Date(Date.now() - 5400000).toISOString()
            }
          ]
        },
        {
          id: 'comm-102',
          author: 'Dennis Ochieng',
          avatar: 'DO',
          avatarBg: '#10b981',
          text: 'Can confirm water here is genuinely 24/7 borehole + council backup. My colleague moved in 3 months ago and loves the balcony view of Two Rivers!',
          createdAt: new Date(Date.now() - 14400000).toISOString(),
          reactions: { likes: 14, loves: 8, fire: 5, clap: 4 },
          userReactions: {},
          replies: []
        }
      ],
      'prop-nrb-002': [
        {
          id: 'comm-201',
          author: 'Kelvin Kiptoo (USIU Student)',
          avatar: 'KK',
          avatarBg: '#8b5cf6',
          text: 'Is this walking distance to TRM and Lumumba Drive stage? Looking for a quiet bedsitter for my final semester.',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          reactions: { likes: 5, loves: 1, fire: 0, clap: 2 },
          userReactions: {},
          replies: [
            {
              id: 'rep-201-1',
              author: 'Grace Wambui (Caretaker)',
              isLandlord: true,
              text: 'Yes Kelvin! Exactly 4 minutes walk to TRM mall and Safaricom / Zuku wifi cables are ready in each room.',
              createdAt: new Date(Date.now() - 9000000).toISOString()
            }
          ]
        }
      ],
      'prop-nrb-003': [
        {
          id: 'comm-301',
          author: 'Dr. Sarah Nduta',
          avatar: 'SN',
          avatarBg: '#ec4899',
          text: 'The finishes on the kitchen and bathrooms in this building are top standard. Generator kicks in within 5 seconds during power cuts.',
          createdAt: new Date(Date.now() - 18000000).toISOString(),
          reactions: { likes: 19, loves: 12, fire: 9, clap: 6 },
          userReactions: {},
          replies: []
        }
      ],
      'prop-bnb-001': [
        {
          id: 'comm-401',
          author: 'Marcus & Linda (Safari Travellers)',
          avatar: 'ML',
          avatarBg: '#f59e0b',
          text: 'Stayed here for 4 nights before flying to Maasai Mara! Self check-in keypad was flawless and Netflix on the Smart TV was great.',
          createdAt: new Date(Date.now() - 21600000).toISOString(),
          reactions: { likes: 11, loves: 9, fire: 3, clap: 5 },
          userReactions: {},
          replies: []
        }
      ]
    };

    // Load any localStorage comments
    const saved = localStorage.getItem('kejamarket_live_comments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.comments = { ...this.comments, ...parsed };
      } catch (e) {
        console.warn('Comments storage parse error');
      }
    }
  }

  saveStorage() {
    localStorage.setItem('kejamarket_live_comments', JSON.stringify(this.comments));
  }

  async fetchPropertyComments(propertyId) {
    try {
      const res = await fetch(`/api/properties/${encodeURIComponent(propertyId)}/comments`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.comments)) {
          this.comments[propertyId] = data.comments;
          this.saveStorage();
        }
      }
    } catch (err) {
      console.log('Using local comments stream (offline fallback)');
    }
  }

  getCommentsForProperty(propertyId) {
    return this.comments[propertyId] || [];
  }

  renderCommentsSection(propertyId, containerEl) {
    if (!containerEl) return;
    const commentsList = this.getCommentsForProperty(propertyId);
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const userInitials = session ? session.name.slice(0, 2).toUpperCase() : 'ME';

    containerEl.innerHTML = `
      <!-- Comments & Critiques Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
        <div style="font-weight: 800; font-size: 1.05rem; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-comments" style="color: #0084ff; font-size: 1.2rem;"></i>
          Tenant Comments & Critiques
          <span style="background: #e0f2fe; color: #0369a1; font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;" id="comment-count-pill-${propertyId}">
            ${commentsList.length}
          </span>
        </div>
        <div style="font-size: 0.78rem; color: #64748b;">
          <i class="fas fa-circle" style="color: #22c55e; font-size: 0.55rem;"></i> Live Public Discussions
        </div>
      </div>

      <!-- New Comment / Critique Input Box -->
      <form id="form-add-comment-${propertyId}" onsubmit="window.commentManager.handleNewComment(event, '${propertyId}')" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; gap: 10px; align-items: flex-start;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #0084ff, #00b53f); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">
            ${userInitials}
          </div>
          <div style="flex: 1;">
            ${!session ? `
              <div style="margin-bottom: 8px;">
                <input type="text" id="comment-author-name-${propertyId}" class="form-control" placeholder="Your Name (e.g. Brian Otieno)" style="font-size: 0.84rem; padding: 6px 12px; border-radius: 6px; width: 100%;" required>
              </div>
            ` : ''}
            <textarea 
              id="comment-text-${propertyId}" 
              class="form-control" 
              placeholder="Leave a comment, question, or critique on this house (e.g. water pressure, security, caretaker, noise)..." 
              rows="2" 
              style="font-size: 0.88rem; border-radius: 8px; resize: none; padding: 10px 12px; width: 100%; line-height: 1.45;"
              required
            ></textarea>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #f8fafc;">
          <!-- Quick Emojis -->
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="window.commentManager.insertEmoji('${propertyId}', '👍')" style="background:none;border:none;font-size:1.15rem;cursor:pointer;" title="Like">👍</button>
            <button type="button" onclick="window.commentManager.insertEmoji('${propertyId}', '👎')" style="background:none;border:none;font-size:1.15rem;cursor:pointer;" title="Critique / Dislike">👎</button>
            <button type="button" onclick="window.commentManager.insertEmoji('${propertyId}', '❤️')" style="background:none;border:none;font-size:1.15rem;cursor:pointer;" title="Love">❤️</button>
            <button type="button" onclick="window.commentManager.insertEmoji('${propertyId}', '🔥')" style="background:none;border:none;font-size:1.15rem;cursor:pointer;" title="Fire">🔥</button>
            <button type="button" onclick="window.commentManager.insertEmoji('${propertyId}', '🏠')" style="background:none;border:none;font-size:1.15rem;cursor:pointer;" title="House">🏠</button>
          </div>

          <button type="submit" class="btn-primary" style="padding: 7px 20px; font-size: 0.85rem; font-weight: 700; background: #0084ff; border: none; border-radius: 20px; display: flex; align-items: center; gap: 6px; cursor: pointer; color: white;">
            <i class="fas fa-paper-plane"></i> Post Comment
          </button>
        </div>
      </form>

      <!-- Comments Stream List -->
      <div id="comments-stream-${propertyId}" style="display: flex; flex-direction: column; gap: 14px;">
        ${this.renderCommentsListHtml(propertyId)}
      </div>
    `;
  }

  renderCommentsListHtml(propertyId) {
    const list = this.getCommentsForProperty(propertyId);
    if (!list || list.length === 0) {
      return `
        <div style="text-align: center; padding: 24px; color: #64748b; background: #f8fafc; border-radius: 10px;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">💬</div>
          <div style="font-weight: 700; color: #1e293b; font-size: 0.9rem;">No comments yet</div>
          <div style="font-size: 0.8rem; color: #64748b;">Be the first to ask a question or leave a critique on this house!</div>
        </div>
      `;
    }

    return list.map(c => this.renderSingleCommentHtml(propertyId, c)).join('');
  }

  renderSingleCommentHtml(propertyId, comment) {
    comment.reactions = comment.reactions || { likes: 0, dislikes: 0, loves: 0, fire: 0 };
    const timeAgoStr = this.formatTimeAgo(comment.createdAt);

    return `
      <div class="fb-comment-item" id="comment-${comment.id}" style="display: flex; gap: 10px; align-items: flex-start;">
        <!-- Avatar -->
        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${comment.avatarBg || '#0084ff'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.82rem; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${comment.avatar || 'U'}
        </div>

        <!-- Comment Bubble & Actions -->
        <div style="flex: 1;">
          <div style="background: #f1f5f9; border-radius: 14px; padding: 10px 14px; display: inline-block; max-width: 100%; word-break: break-word;">
            <div style="font-weight: 700; font-size: 0.88rem; color: #0f172a; display: flex; align-items: center; gap: 6px;">
              ${comment.author}
              ${comment.isLandlord ? '<span style="background: #e0e7ff; color: #4338ca; font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 800;"><i class="fas fa-check-circle"></i> Landlord / Host</span>' : ''}
            </div>
            <div style="font-size: 0.88rem; color: #1e293b; margin-top: 3px; line-height: 1.45;">
              ${comment.text}
            </div>
          </div>

          <!-- Comment Action Row (Like, Dislike/Critique, Love, Reply, Timestamp) -->
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 0.76rem; color: #64748b; padding-left: 4px;">
            <button type="button" onclick="window.commentManager.reactToComment('${propertyId}', '${comment.id}', 'likes')" style="background:none; border:none; color:#475569; font-weight:700; cursor:pointer; padding:0; display:flex; align-items:center; gap:3px;">
              👍 ${comment.reactions.likes > 0 ? `${comment.reactions.likes}` : 'Like'}
            </button>
            <button type="button" onclick="window.commentManager.reactToComment('${propertyId}', '${comment.id}', 'dislikes')" style="background:none; border:none; color:#64748b; font-weight:700; cursor:pointer; padding:0; display:flex; align-items:center; gap:3px;">
              👎 ${comment.reactions.dislikes > 0 ? `${comment.reactions.dislikes}` : ''}
            </button>
            <button type="button" onclick="window.commentManager.reactToComment('${propertyId}', '${comment.id}', 'loves')" style="background:none; border:none; color:#ef4444; font-weight:700; cursor:pointer; padding:0; display:flex; align-items:center; gap:3px;">
              ❤️ ${comment.reactions.loves > 0 ? `${comment.reactions.loves}` : ''}
            </button>
            <button type="button" onclick="window.commentManager.reactToComment('${propertyId}', '${comment.id}', 'fire')" style="background:none; border:none; color:#f97316; font-weight:700; cursor:pointer; padding:0; display:flex; align-items:center; gap:3px;">
              🔥 ${comment.reactions.fire > 0 ? `${comment.reactions.fire}` : ''}
            </button>
            <button type="button" onclick="window.commentManager.toggleReplyBox('${comment.id}')" style="background:none; border:none; color:#0284c7; font-weight:700; cursor:pointer; padding:0;">
              Reply
            </button>
            <span>· ${timeAgoStr}</span>
          </div>

          <!-- Nested Replies -->
          ${comment.replies && comment.replies.length > 0 ? `
            <div style="margin-top: 8px; padding-left: 12px; border-left: 2px solid #cbd5e1; display: flex; flex-direction: column; gap: 8px;">
              ${comment.replies.map(r => `
                <div style="display: flex; gap: 8px; align-items: flex-start;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: ${r.isLandlord ? '#00b53f' : '#64748b'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; flex-shrink: 0;">
                    ${(r.author || 'L').slice(0, 2).toUpperCase()}
                  </div>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 12px; flex: 1;">
                    <div style="font-weight: 700; font-size: 0.8rem; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                      ${r.author}
                      ${r.isLandlord ? '<span style="background: #dcfce7; color: #166534; font-size: 0.62rem; padding: 1px 5px; border-radius: 3px; font-weight: 800;">Landlord</span>' : ''}
                    </div>
                    <div style="font-size: 0.82rem; color: #334155; margin-top: 2px;">
                      ${r.text}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Reply Box (Hidden by default) -->
          <div id="reply-box-${comment.id}" style="display: none; margin-top: 8px; padding-left: 12px;">
            <form onsubmit="window.commentManager.handleReplySubmit(event, '${propertyId}', '${comment.id}')" style="display: flex; gap: 6px;">
              <input type="text" id="reply-input-${comment.id}" class="form-control" placeholder="Write a public reply..." style="font-size: 0.8rem; padding: 6px 10px; border-radius: 16px; flex: 1;" required>
              <button type="submit" class="btn-primary" style="padding: 6px 12px; font-size: 0.78rem; border-radius: 16px; background: #0084ff; border: none; cursor: pointer;">
                Reply
              </button>
            </form>
          </div>

        </div>
      </div>
    `;
  }

  insertEmoji(propertyId, emoji) {
    const input = document.getElementById(`comment-text-${propertyId}`);
    if (input) {
      input.value = (input.value || '') + ' ' + emoji;
      input.focus();
    }
  }

  toggleReplyBox(commentId) {
    const box = document.getElementById(`reply-box-${commentId}`);
    if (box) {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
      if (box.style.display === 'block') {
        const input = document.getElementById(`reply-input-${commentId}`);
        if (input) input.focus();
      }
    }
  }

  async handleNewComment(e, propertyId) {
    e.preventDefault();
    const textInput = document.getElementById(`comment-text-${propertyId}`);
    const authorInput = document.getElementById(`comment-author-name-${propertyId}`);
    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;

    const text = textInput ? textInput.value.trim() : '';
    const author = session ? session.name : (authorInput ? authorInput.value.trim() : 'Nairobi Resident');

    if (!text) return;

    const colors = ['#0084ff', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];
    const initials = author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const newComment = {
      id: 'comm-' + Date.now(),
      author,
      avatar: initials,
      avatarBg: randomBg,
      isLandlord: session && session.role === 'landlord',
      text,
      createdAt: new Date().toISOString(),
      reactions: { likes: 0, dislikes: 0, loves: 0, fire: 0 },
      userReactions: {},
      replies: []
    };

    if (!this.comments[propertyId]) {
      this.comments[propertyId] = [];
    }

    this.comments[propertyId].unshift(newComment);
    this.saveStorage();

    // Re-render comments stream
    const stream = document.getElementById(`comments-stream-${propertyId}`);
    if (stream) {
      stream.innerHTML = this.renderCommentsListHtml(propertyId);
    }
    const countPill = document.getElementById(`comment-count-pill-${propertyId}`);
    if (countPill) {
      countPill.textContent = this.comments[propertyId].length;
    }

    if (textInput) textInput.value = '';
    if (window.app) window.app.showToast('💬 Comment posted live!', 'success');

    // Post to backend
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (window.kejaAuth && window.kejaAuth.getToken()) {
        headers['Authorization'] = `Bearer ${window.kejaAuth.getToken()}`;
      }
      await fetch(`/api/properties/${encodeURIComponent(propertyId)}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ author, text })
      });
    } catch (err) {
      console.warn('Comment backend sync error');
    }
  }

  async reactToComment(propertyId, commentId, reactionType) {
    const list = this.getCommentsForProperty(propertyId);
    const comment = list.find(c => c.id === commentId);
    if (!comment) return;

    comment.reactions = comment.reactions || { likes: 0, loves: 0, fire: 0, clap: 0 };
    comment.reactions[reactionType] = (comment.reactions[reactionType] || 0) + 1;
    this.saveStorage();

    // Re-render comment item
    const el = document.getElementById(`comment-${commentId}`);
    if (el) {
      el.outerHTML = this.renderSingleCommentHtml(propertyId, comment);
    }

    // Post reaction to backend
    try {
      await fetch(`/api/properties/${encodeURIComponent(propertyId)}/comments/${encodeURIComponent(commentId)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType })
      });
    } catch (err) {
      console.warn('Reaction sync error');
    }
  }

  async handleReplySubmit(e, propertyId, commentId) {
    e.preventDefault();
    const input = document.getElementById(`reply-input-${commentId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const session = window.kejaAuth ? window.kejaAuth.getSession() : null;
    const author = session ? session.name : 'Resident';
    const isLandlord = session && session.role === 'landlord';

    const list = this.getCommentsForProperty(propertyId);
    const comment = list.find(c => c.id === commentId);
    if (!comment) return;

    comment.replies = comment.replies || [];
    const reply = {
      id: 'rep-' + Date.now(),
      author,
      isLandlord,
      text,
      createdAt: new Date().toISOString()
    };
    comment.replies.push(reply);
    this.saveStorage();

    // Re-render comment
    const el = document.getElementById(`comment-${commentId}`);
    if (el) {
      el.outerHTML = this.renderSingleCommentHtml(propertyId, comment);
    }

    if (window.app) window.app.showToast('💬 Reply posted!', 'success');

    // Post reply to backend
    try {
      await fetch(`/api/properties/${encodeURIComponent(propertyId)}/comments/${encodeURIComponent(commentId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text })
      });
    } catch (err) {
      console.warn('Reply sync error');
    }
  }

  formatTimeAgo(isoDate) {
    if (!isoDate) return 'Just now';
    const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }
}

window.commentManager = new CommentManager();
