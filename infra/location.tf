########################################
# AWS Location Service — reverse geocoding
########################################

resource "aws_location_place_index" "main" {
  index_name  = "${var.app_name}-places"
  data_source = "Esri"
  description = "Reverse geocoding for civic report locations"

  data_source_configuration {
    intended_use = "SingleUse"
  }

  tags = var.tags
}
