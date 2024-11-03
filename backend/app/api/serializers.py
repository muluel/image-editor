from rest_framework import serializers
from .models import Image  # Create a model to store image details if needed.


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = "__all__"
