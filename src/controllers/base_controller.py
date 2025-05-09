from helpers import get_settings


class BaseController:
    def __init__(self):
        self.app_settings = get_settings()
