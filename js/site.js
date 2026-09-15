const KEY="ao-cart-v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));paint()}
function count(s){return Object.values(s).reduce((n,v)=>n+v,0)}
function paint(){
  const n=count(load());
  document.querySelectorAll("[data-cart-count]").forEach(el=>{
    el.textContent=String(n);
    el.classList.toggle("show", n>0);
  });
  const list=document.querySelector("[data-cart-list]");
  if(list) renderCart(list);
}
function add(id){
  const s=load(); s[id]=(s[id]||0)+1; save(s);
}
function setQty(id,q){
  const s=load(); if(q<=0) delete s[id]; else s[id]=q; save(s);
}
const EDITIONS={
  ebook:{name:"Digital edition",price:999},
  illustrated:{name:"Illustrated digital",price:1699},
  audio:{name:"Narrated reader",price:1999},
  hardcover:{name:"Cloth hardcover",price:2800},
  bundle:{name:"Complete Æon",price:3999}
};
function usd(c){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(c/100)}
function renderCart(root){
  const s=load();
  const ids=Object.keys(s);
  if(!ids.length){
    root.innerHTML='<p class="muted">Cart is empty.</p><p><a class="btn ghost" href="shop.html">See editions</a></p>';
    return;
  }
  let total=0;
  root.innerHTML=ids.map(id=>{
    const ed=EDITIONS[id]; if(!ed) return "";
    const q=s[id]; total+=ed.price*q;
    return '<div class="cart-line"><div><strong>'+ed.name+'</strong><p class="subtle">'+usd(ed.price)+'</p></div><div><input aria-label="Quantity" type="number" min="0" value="'+q+'" data-qty="'+id+'" style="width:4.5rem;min-height:44px;background:#14110f;color:#ede3d0;border:1px solid rgba(237,227,208,.16);border-radius:8px;padding:.4rem .6rem"></div></div>';
  }).join("")+'<p class="price" style="margin-top:1.5rem">'+usd(total)+'</p><p class="row" style="margin-top:1rem"><a class="btn" href="checkout.html">Checkout</a></p>';
  root.querySelectorAll("[data-qty]").forEach(inp=>{
    inp.addEventListener("change",()=>setQty(inp.getAttribute("data-qty"), Number(inp.value)||0));
  });
}
document.addEventListener("click",(e)=>{
  const addBtn=e.target.closest("[data-add]");
  if(addBtn){ add(addBtn.getAttribute("data-add")); addBtn.textContent="Added"; setTimeout(()=>addBtn.textContent=addBtn.getAttribute("data-label")||"Add to cart",900); }
  const burger=e.target.closest("[data-menu]");
  if(burger){
    const panel=document.querySelector("[data-menu-panel]");
    const open=panel.style.display==="block";
    panel.style.display=open?"none":"block";
    burger.setAttribute("aria-expanded", String(!open));
  }
});
document.addEventListener("DOMContentLoaded",()=>{
  paint();
  const form=document.querySelector("[data-checkout]");
  if(form){
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      const s=load();
      if(!count(s)) return;
      localStorage.removeItem(KEY);
      paint();
      form.hidden=true;
      document.querySelector("[data-thanks]").hidden=false;
    });
  }
});
