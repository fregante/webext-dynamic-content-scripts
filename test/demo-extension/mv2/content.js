document.body.insertAdjacentHTML(
	'beforeEnd',
	`
		<p class="web-ext" style="
			padding: 4px;
			font-size: 20px;
			background: cornflowerblue;
			display: inline-block;
		">
			Content script loaded
		</p>
	`,
);
console.log('Content script loaded', new Date());
