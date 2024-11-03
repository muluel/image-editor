from django.db import models


def upload_to(instance, filename):
    return "/".join(["images", str(instance.name), filename])


class Image(models.Model):
    name = models.CharField(verbose_name="Name", max_length=100)
    image = models.ImageField(
        upload_to=upload_to, verbose_name="Image", blank=True, null=True
    )
