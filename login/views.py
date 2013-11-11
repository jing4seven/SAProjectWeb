from lib.pages import BasePage

class Login(BasePage):

	template_name = "login.html"
	

	def before_render(self, request, *args, **kwargs):
		self.set_title("Login")
		self.add_context(name='Juicy Chen')
		return
	