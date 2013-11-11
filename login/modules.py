from lib.modules import BaseModule

class SignInForm(BaseModule):
	template_name = "sign_in_form.html"

	def before_render(self, request, *args, **kwargs):		
		
		return