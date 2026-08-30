document.body.insertAdjacentHTML(
	'afterBegin',
	`
		<span class="web-ext" style="
			display: inline-block;
			padding: 4px;
			font-size: 20px;
			background: gray;
		">
			JS LOADED
		</span>
	`,
);
console.log('Content script loaded', new Date());
